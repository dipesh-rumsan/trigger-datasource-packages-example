import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@lib/database';
import type { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from '@lib/database';
import { GlofasService } from './glofas.service';
import { AddTriggerStatementDto } from './dto';
import { SourcesDataService } from './sources-data.service';
import { of } from 'rxjs';

jest.mock('@lib/database', () => ({
  ...jest.requireActual('@lib/database'),
  SettingsService: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'DATASOURCE.GLOFAS') {
        return {
          LOCATION: 'test-location',
          URL: 'http://test-url.com',
        };
      }
      return {
        GLOFAS: [
          {
            LOCATION: 'test-location',
            URL: 'http://test-url.com',
          },
        ],
      };
    }),
  },
}));

describe('GlofasService', () => {
  let service: GlofasService;
  let prismaService: PrismaService;
  let httpService: HttpService;
  let triggerQueue: Queue;
  let eventEmitter: EventEmitter2;
  let sourceDataService: SourcesDataService;

  const mockPrismaService = {
    trigger: {
      findUnique: jest.fn(),
    },
    sourcesData: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    source: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    axiosRef: {
      get: jest.fn(),
      post: jest.fn(),
    },
  };

  const mockTriggerQueue = {
    add: jest.fn(),
    process: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockSourceDataService = {
    getWaterLevels: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlofasService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: 'BullQueue_TRIGGER',
          useValue: mockTriggerQueue,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: SourcesDataService,
          useValue: mockSourceDataService,
        },
      ],
    }).compile();

    service = module.get<GlofasService>(GlofasService);
    prismaService = module.get<PrismaService>(PrismaService);
    httpService = module.get<HttpService>(HttpService);
    triggerQueue = module.get<Queue>('BullQueue_TRIGGER');
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    sourceDataService = module.get<SourcesDataService>(SourcesDataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStationData', () => {
    const mockPayload = {
      station: 'test-station',
      date: '2023-01-01',
      URL: 'http://test-url.com',
    } as any;

    const mockResponse = { data: 'station-data' };

    beforeEach(() => {
      mockHttpService.get.mockReturnValue(of({ data: mockResponse }));
    });

    it('should return station data successfully', async () => {
      mockHttpService.axiosRef.get.mockResolvedValue({ data: mockResponse });

      const result = await service.getStationData(mockPayload);

      expect(mockHttpService.axiosRef.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should throw RpcException when HTTP request fails', async () => {
      const error = new Error('HTTP error');
      mockHttpService.axiosRef.get.mockRejectedValue(error);

      await expect(service.getStationData(mockPayload)).rejects.toThrow();
    });
  });

  describe('saveGlofasStationData', () => {
    const mockRiverBasin = 'test-basin';
    const mockPayload = {
      forecastDate: '2023-01-01',
      returnPeriodTable: {
        returnPeriodData: [['2023-01-01-1']],
        returnPeriodHeaders: ['1'],
      },
    } as any;

    beforeEach(() => {
      mockPrismaService.source.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.sourcesData.create.mockResolvedValue({ id: 1 });
    });

    it('should save data successfully when source exists', async () => {
      mockPrismaService.sourcesData.findFirst.mockResolvedValue(null);
      mockSourceDataService.create.mockResolvedValue({ id: 1 });

      const result = await service.saveGlofasStationData(
        mockRiverBasin,
        mockPayload,
      );

      expect(mockPrismaService.sourcesData.findFirst).toHaveBeenCalledWith({
        where: {
          dataSource: DataSource.GLOFAS,
          source: {
            riverBasin: mockRiverBasin,
          },
          info: {
            path: ['forecastDate'],
            equals: mockPayload.forecastDate,
          },
        },
      });

      expect(mockSourceDataService.create).toHaveBeenCalledWith({
        riverBasin: mockRiverBasin,
        source: 'GLOFAS',
        type: 'WATER_LEVEL',
        info: JSON.parse(JSON.stringify(mockPayload)),
      });

      expect(result).toBeUndefined();
    });

    it('should not create new record when record already exists', async () => {
      mockPrismaService.sourcesData.findFirst.mockResolvedValue({ id: 1 });

      const result = await service.saveGlofasStationData(
        mockRiverBasin,
        mockPayload,
      );

      expect(mockPrismaService.sourcesData.findFirst).toHaveBeenCalled();
      expect(mockSourceDataService.create).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should handle error when saving fails', async () => {
      const error = new Error('Database error');
      mockPrismaService.sourcesData.findFirst.mockRejectedValue(error);

      // The method catches errors and logs them, so it should not throw
      await expect(
        service.saveGlofasStationData(mockRiverBasin, mockPayload),
      ).resolves.not.toThrow();
    });
  });

  describe('getLatestWaterLevels', () => {
    const mockWaterLevels = [
      { id: 1, info: { level: 100 } },
      { id: 2, info: { level: 150 } },
    ];

    beforeEach(() => {
      mockPrismaService.sourcesData.findMany.mockResolvedValue(mockWaterLevels);
    });

    it('should return latest water levels', async () => {
      const mockWaterLevel = { id: 1, info: { level: 100 } };
      mockPrismaService.sourcesData.findFirst.mockResolvedValue(mockWaterLevel);

      const result = await service.getLatestWaterLevels();

      expect(mockPrismaService.sourcesData.findFirst).toHaveBeenCalledWith({
        where: {
          source: {
            riverBasin: 'test-location',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(mockWaterLevel);
    });
  });

  describe('findGlofasDataByDate', () => {
    const mockRiverBasin = 'test-basin';
    const mockForecastDate = '2023-01-01';
    const mockData = { id: 1, info: { date: mockForecastDate } };

    beforeEach(() => {
      mockPrismaService.sourcesData.findFirst.mockResolvedValue(mockData);
    });

    it('should find Glofas data by date', async () => {
      const result = await service.findGlofasDataByDate(
        mockRiverBasin,
        mockForecastDate,
      );

      expect(mockPrismaService.sourcesData.findFirst).toHaveBeenCalledWith({
        where: {
          source: {
            riverBasin: {
              contains: mockRiverBasin,
            },
          },
          dataSource: DataSource.GLOFAS,
          info: {
            path: ['forecastDate'],
            equals: mockForecastDate,
          },
        },
      });

      expect(result).toEqual(mockData);
    });

    it('should return null when no data found', async () => {
      mockPrismaService.sourcesData.findFirst.mockResolvedValue(null);

      const result = await service.findGlofasDataByDate(
        mockRiverBasin,
        mockForecastDate,
      );

      expect(result).toBeNull();
    });
  });
});
