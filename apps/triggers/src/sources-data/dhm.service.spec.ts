import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SourceType } from '@lib/database';
import { PrismaService } from '@lib/database';
import type { Queue } from 'bull';
import { DhmService } from './dhm.service';
import { RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';
jest.mock('@lib/core', () => ({
  SettingsService: {
    get: jest.fn().mockReturnValue({
      DHM: [
        {
          WATER_LEVEL: {
            LOCATION: 'test-location',
            SERIESID: [1, 2, 3],
          },
          RAINFALL: {
            LOCATION: 'test-location',
            SERIESID: [4, 5, 6],
          },
        },
      ],
    }),
  },
}));

jest.mock('src/common', () => ({
  ...jest.requireActual('src/common'),
  scrapeDataFromHtml: jest
    .fn()
    .mockReturnValue([{ Date: '2023-01-01', Point: 100 }]),
}));

describe('DhmService', () => {
  let service: DhmService;
  let prismaService: PrismaService;
  let httpService: HttpService;
  let configService: ConfigService;
  let triggerQueue: Queue;

  const mockPrismaService = {
    trigger: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sourcesData: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    source: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    phase: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    axiosRef: {
      get: jest.fn(),
      post: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTriggerQueue = {
    add: jest.fn(),
    process: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DhmService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'BullQueue_TRIGGER',
          useValue: mockTriggerQueue,
        },
      ],
    }).compile();

    service = module.get<DhmService>(DhmService);
    prismaService = module.get<PrismaService>(PrismaService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    triggerQueue = module.get<Queue>('BullQueue_TRIGGER');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRiverStations', () => {
    const mockRiverStations = [
      { id: 1, name: 'Station 1' },
      { id: 2, name: 'Station 2' },
    ];

    beforeEach(() => {
      mockHttpService.get.mockReturnValue(of({ data: mockRiverStations }));
    });

    it('should return river stations successfully', async () => {
      mockConfigService.get.mockReturnValue('http://test-url.com');
      mockHttpService.axiosRef.get.mockResolvedValue({
        data: mockRiverStations,
      });

      const result = await service.getRiverStations();

      expect(mockHttpService.axiosRef.get).toHaveBeenCalled();
      expect(result).toEqual(mockRiverStations);
    });

    it('should throw RpcException when HTTP request fails', async () => {
      const error = new Error('HTTP error');
      mockConfigService.get.mockReturnValue('http://test-url.com');
      mockHttpService.axiosRef.get.mockRejectedValue(error);

      await expect(service.getRiverStations()).rejects.toThrow(RpcException);
    });
  });

  describe('getData', () => {
    const mockUrl = 'http://test-url.com';
    const mockData = { data: 'test' };

    beforeEach(() => {
      mockHttpService.get.mockReturnValue(of({ data: mockData }));
    });

    it('should return data successfully', async () => {
      mockHttpService.axiosRef.get.mockResolvedValue({ data: mockData });

      const result = await service.getData(mockUrl);

      expect(mockHttpService.axiosRef.get).toHaveBeenCalledWith(mockUrl);
      expect(result).toEqual({ data: mockData });
    });

    it('should throw RpcException when HTTP request fails', async () => {
      const error = new Error('HTTP error');
      mockHttpService.axiosRef.get.mockRejectedValue(error);

      await expect(service.getData(mockUrl)).rejects.toThrow();
    });
  });

  describe('getDhmRiverWatchData', () => {
    const mockPayload = {
      date: '2023-01-01',
      period: 'POINT',
      seriesid: '123',
      location: 'test-location',
    };

    const mockResponse = { data: 'river-watch-data' };

    beforeEach(() => {
      mockHttpService.get.mockReturnValue(of({ data: mockResponse }));
    });

    it('should return DHM river watch data successfully', async () => {
      const mockResponse = {
        data: { data: { table: '<table>test data</table>' } },
      };
      mockHttpService.axiosRef.post.mockResolvedValue(mockResponse);

      const result = await service.getDhmRiverWatchData(mockPayload);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalled();
      expect(result).toEqual([{ Date: '2023-01-01', Point: 100 }]);
    });

    it('should handle error when HTTP request fails', async () => {
      const error = new Error('HTTP error');
      mockHttpService.axiosRef.post.mockRejectedValue(error);

      // The method catches errors and logs them, so it should not throw
      await expect(
        service.getDhmRiverWatchData(mockPayload),
      ).resolves.not.toThrow();
    });
  });

  describe('getDhmRainfallWatchData', () => {
    const mockPayload = {
      date: '2023-01-01',
      period: 'POINT',
      seriesid: '123',
      location: 'test-location',
    };

    const mockResponse = { data: 'rainfall-watch-data' };

    beforeEach(() => {
      mockHttpService.get.mockReturnValue(of({ data: mockResponse }));
    });

    it('should return DHM rainfall watch data successfully', async () => {
      const mockResponse = {
        data: { data: { table: '<table>test data</table>' } },
      };
      mockHttpService.axiosRef.post.mockResolvedValue(mockResponse);

      const result = await service.getDhmRainfallWatchData(mockPayload);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalled();
      expect(result).toEqual([{ Date: '2023-01-01', Point: 100 }]);
    });

    it('should handle error when HTTP request fails', async () => {
      const error = new Error('HTTP error');
      mockHttpService.axiosRef.post.mockRejectedValue(error);

      // The method catches errors and logs them, so it should not throw
      await expect(
        service.getDhmRainfallWatchData(mockPayload),
      ).resolves.not.toThrow();
    });
  });

  describe('normalizeDhmRiverAndRainfallWatchData', () => {
    const mockDataArray = [
      { date: '2023-01-01', value: 100 },
      { date: '2023-01-02', value: 150 },
    ] as any;

    it('should normalize data successfully', async () => {
      const mockDataArray = [
        { Date: '2023-01-01', Point: 100 },
        { Date: '2023-01-02', Average: 150, Max: 200, Min: 100 },
      ] as any;

      const result =
        await service.normalizeDhmRiverAndRainfallWatchData(mockDataArray);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('should handle empty data array', async () => {
      const result = await service.normalizeDhmRiverAndRainfallWatchData([]);

      expect(result).toEqual([]);
    });
  });
});
