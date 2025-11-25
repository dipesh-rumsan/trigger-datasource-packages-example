import { PrismaClient, DataSource, Phases } from '../../generated/prisma';

const prisma = new PrismaClient();

const riverBasin = 'Doda river at East-West Highway';
const activeYear2081 = '2081/82';
const supportedSources: DataSource[] = [
  DataSource.DHM,
  DataSource.GLOFAS,
  DataSource.GFH,
];

type PhaseSeedInput = {
  readonly name: Phases;
  readonly activeYear: string;
  readonly riverBasin: string;
  readonly requiredMandatoryTriggers: number;
  readonly requiredOptionalTriggers: number;
  readonly canRevert: boolean;
  readonly canTriggerPayout: boolean;
  readonly isActive: boolean;
};

const phases: ReadonlyArray<PhaseSeedInput> = [
  {
    name: Phases.PREPAREDNESS,
    activeYear: activeYear2081,
    riverBasin,
    requiredMandatoryTriggers: 1,
    requiredOptionalTriggers: 0,
    canRevert: false,
    canTriggerPayout: false,
    isActive: true,
  },
  {
    name: Phases.READINESS,
    activeYear: activeYear2081,
    riverBasin,
    requiredMandatoryTriggers: 2,
    requiredOptionalTriggers: 1,
    canRevert: true,
    canTriggerPayout: false,
    isActive: false,
  },
  {
    name: Phases.ACTIVATION,
    activeYear: activeYear2081,
    riverBasin,
    requiredMandatoryTriggers: 3,
    requiredOptionalTriggers: 2,
    canRevert: true,
    canTriggerPayout: true,
    isActive: false,
  },
];

const ensureSourceExists = async (): Promise<void> => {
  await prisma.source.upsert({
    where: { riverBasin },
    update: {
      source: supportedSources,
    },
    create: {
      riverBasin,
      source: supportedSources,
    },
  });
};

const upsertPhases = async (): Promise<void> => {
  for (const phase of phases) {
    await prisma.phase.upsert({
      where: {
        riverBasin_activeYear_name: {
          riverBasin: phase.riverBasin,
          activeYear: phase.activeYear,
          name: phase.name,
        },
      },
      update: {
        requiredMandatoryTriggers: phase.requiredMandatoryTriggers,
        requiredOptionalTriggers: phase.requiredOptionalTriggers,
        canRevert: phase.canRevert,
        canTriggerPayout: phase.canTriggerPayout,
        isActive: phase.isActive,
      },
      create: {
        name: phase.name,
        activeYear: phase.activeYear,
        riverBasin: phase.riverBasin,
        requiredMandatoryTriggers: phase.requiredMandatoryTriggers,
        requiredOptionalTriggers: phase.requiredOptionalTriggers,
        canRevert: phase.canRevert,
        canTriggerPayout: phase.canTriggerPayout,
        isActive: phase.isActive,
      },
    });
  }
};

const main = async (): Promise<void> => {
  console.log('#'.repeat(30));
  console.log('Seeding PHASES');
  console.log('#'.repeat(30));
  await ensureSourceExists();
  await upsertPhases();
};

main()
  .catch(async (error) => {
    console.log('#'.repeat(30));
    console.log('Error during seeding PHASES');
    console.log(error);
    console.log('#'.repeat(30));
  })
  .finally(async () => {
    console.log('#'.repeat(30));
    console.log('Seeding completed for PHASES');
    console.log('#'.repeat(30));
    console.log('\n');
    await prisma.$disconnect();
  });
