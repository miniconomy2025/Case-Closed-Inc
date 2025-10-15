import DecisionEngine from '../../../cron/jobs/decisionEngine';
import SimulateProduction from '../../../cron/jobs/simulateProduction';
import CancelUnpaidOrdersJob from '../../../cron/jobs/canelUnpaidOrders';
import logger from '../../../utils/logger';

// Mock job classes and track their instances
const mockDecisionEngine = { run: jest.fn() };
const mockSimulateProduction = { run: jest.fn() };
const mockCancelUnpaidOrdersJob = { run: jest.fn() };

jest.mock('../../../cron/jobs/decisionEngine.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockDecisionEngine),
}));

jest.mock('../../../cron/jobs/simulateProduction.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockSimulateProduction),
}));

jest.mock('../../../cron/jobs/canelUnpaidOrders.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockCancelUnpaidOrdersJob),
}));

// Mock logger
jest.mock('../../../utils/logger.js', () => ({
  info: jest.fn(),
}));

jest.mock('../../../clients/ThohClient');
jest.mock('../../../daos/simulationDao');
jest.mock('../../../utils/sqsClient');

describe('SimulationTimer', () => {
  let simulationTimer;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    const { SimulationTimer } = await import('../../../controllers/simulationController.js');
    SimulationTimer.instance = null;
    simulationTimer = new SimulationTimer();
});

  afterEach(() => {
    jest.useRealTimers();
    if (simulationTimer && simulationTimer.interval) {
      clearInterval(simulationTimer.interval);
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when instantiated multiple times', async () => {
      const { SimulationTimer } = await import('../../../controllers/simulationController.js');
      
      const instance1 = new SimulationTimer();
      const instance2 = new SimulationTimer();
      
      expect(instance1).toBe(instance2);
    });

    it('should maintain state across instances', async () => {
        const { SimulationTimer } = await import('../../../controllers/simulationController.js');
      
      const instance1 = new SimulationTimer();
      instance1.daysSinceStart = 42;
      
      const instance2 = new SimulationTimer();
      
      expect(instance2.daysSinceStart).toBe(42);
    });
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(simulationTimer.daysSinceStart).toBe(0);
      expect(simulationTimer.dayOfMonth).toBe(1);
      expect(simulationTimer.month).toBe(1);
      expect(simulationTimer.year).toBe(2050);
      expect(simulationTimer.interval).toBeNull();
    });

    it('should initialize with three jobs', () => {
      expect(simulationTimer.jobs).toHaveLength(3);
      expect(DecisionEngine).toHaveBeenCalledTimes(1);
      expect(SimulateProduction).toHaveBeenCalledTimes(1);
      expect(CancelUnpaidOrdersJob).toHaveBeenCalledWith(simulationTimer);
    });
  });

  describe('startOfSim', () => {
    it('should log the current date and run DecisionEngine', async () => {
      await simulationTimer.startOfSim();

      expect(logger.info).toHaveBeenCalledWith('[Date]: 2050-01-01');
      expect(mockDecisionEngine.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('incrementDate', () => {
    it('should increment day of month', () => {
      simulationTimer.incrementDate();

      expect(simulationTimer.daysSinceStart).toBe(1);
      expect(simulationTimer.dayOfMonth).toBe(2);
      expect(simulationTimer.month).toBe(1);
      expect(simulationTimer.year).toBe(2050);
    });

    it('should roll over to next month after day 30', () => {
      simulationTimer.dayOfMonth = 30;
      simulationTimer.incrementDate();

      expect(simulationTimer.dayOfMonth).toBe(1);
      expect(simulationTimer.month).toBe(2);
      expect(simulationTimer.year).toBe(2050);
    });

    it('should roll over to next year after month 12', () => {
      simulationTimer.dayOfMonth = 30;
      simulationTimer.month = 12;
      simulationTimer.incrementDate();

      expect(simulationTimer.dayOfMonth).toBe(1);
      expect(simulationTimer.month).toBe(1);
      expect(simulationTimer.year).toBe(2051);
    });

    it('should increment daysSinceStart on each call', () => {
      simulationTimer.incrementDate();
      expect(simulationTimer.daysSinceStart).toBe(1);
      
      simulationTimer.incrementDate();
      expect(simulationTimer.daysSinceStart).toBe(2);
      
      simulationTimer.incrementDate();
      expect(simulationTimer.daysSinceStart).toBe(3);
    });
  });

  describe('getDate', () => {
    it('should return properly formatted date string', () => {
      expect(simulationTimer.getDate()).toBe('2050-01-01');
    });

    it('should pad single digit months and days with zero', () => {
      simulationTimer.dayOfMonth = 5;
      simulationTimer.month = 3;
      
      expect(simulationTimer.getDate()).toBe('2050-03-05');
    });

    it('should not pad double digit values', () => {
      simulationTimer.dayOfMonth = 15;
      simulationTimer.month = 11;
      
      expect(simulationTimer.getDate()).toBe('2050-11-15');
    });

    it('should handle end of year correctly', () => {
      simulationTimer.dayOfMonth = 30;
      simulationTimer.month = 12;
      simulationTimer.year = 2050;
      
      expect(simulationTimer.getDate()).toBe('2050-12-30');
    });
  });

  describe('getDaysOfSimulation', () => {
    it('should return the days since start', () => {
      simulationTimer.daysSinceStart = 42;
      
      expect(simulationTimer.getDaysOfSimulation()).toBe(42);
    });

    it('should return 0 for initial state', () => {
      expect(simulationTimer.getDaysOfSimulation()).toBe(0);
    });
  });

  describe('getDaysPassed', () => {
    it('should calculate days passed from start date', () => {
      simulationTimer.dayOfMonth = 15;
      simulationTimer.month = 2;
      simulationTimer.year = 2050;

      const daysPassed = simulationTimer.getDaysPassed('2050-01-01');
      
      // From Jan 1 to Feb 15: 30 days (Jan) + 14 days = 44 days
      expect(daysPassed).toBe(44);
    });

    it('should handle year transitions', () => {
      simulationTimer.dayOfMonth = 15;
      simulationTimer.month = 2;
      simulationTimer.year = 2051;

      const daysPassed = simulationTimer.getDaysPassed('2050-01-01');
      
      // 360 days (full year) + 30 days (Jan) + 14 days = 404 days
      expect(daysPassed).toBe(404);
    });

    it('should return 0 for the same date', () => {
      const daysPassed = simulationTimer.getDaysPassed('2050-01-01');
      
      expect(daysPassed).toBe(0);
    });

    it('should handle multiple years', () => {
      simulationTimer.dayOfMonth = 1;
      simulationTimer.month = 1;
      simulationTimer.year = 2052;

      const daysPassed = simulationTimer.getDaysPassed('2050-01-01');
      
      // 2 full years = 720 days
      expect(daysPassed).toBe(720);
    });
  });

  describe('startOfDay', () => {
    it('should increment date and run all jobs', () => {
      simulationTimer.startOfDay();

      expect(simulationTimer.daysSinceStart).toBe(1);
      expect(simulationTimer.dayOfMonth).toBe(2);
      expect(mockDecisionEngine.run).toHaveBeenCalledTimes(1);
      expect(mockSimulateProduction.run).toHaveBeenCalledTimes(1);
      expect(mockCancelUnpaidOrdersJob.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('run', () => {
    it('should start an interval that calls startOfDay', async () => {
      await simulationTimer.run();

      expect(simulationTimer.interval).not.toBeNull();

      // Fast-forward time by 2 minutes
      jest.advanceTimersByTime(120000);

      expect(simulationTimer.dayOfMonth).toBe(2);
      expect(mockDecisionEngine.run).toHaveBeenCalled();
    });

    it('should not create multiple intervals if called multiple times', async () => {
      await simulationTimer.run();
      const firstInterval = simulationTimer.interval;

      await simulationTimer.run();
      const secondInterval = simulationTimer.interval;

      expect(firstInterval).toBe(secondInterval);
    });

    it('should call startOfDay every 2 minutes', async () => {
      await simulationTimer.run();

      jest.advanceTimersByTime(120000); // 2 minutes
      expect(simulationTimer.daysSinceStart).toBe(1);

      jest.advanceTimersByTime(120000); // 2 more minutes
      expect(simulationTimer.daysSinceStart).toBe(2);

      jest.advanceTimersByTime(120000); // 2 more minutes
      expect(simulationTimer.daysSinceStart).toBe(3);
    });

    it('should handle interval being null initially', async () => {
      expect(simulationTimer.interval).toBeNull();
      
      await simulationTimer.run();
      
      expect(simulationTimer.interval).not.toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all date values to initial state', async () => {
      simulationTimer.daysSinceStart = 100;
      simulationTimer.dayOfMonth = 15;
      simulationTimer.month = 6;
      simulationTimer.year = 2051;

      await simulationTimer.reset();

      expect(simulationTimer.daysSinceStart).toBe(0);
      expect(simulationTimer.dayOfMonth).toBe(1);
      expect(simulationTimer.month).toBe(1);
      expect(simulationTimer.year).toBe(2050);
    });

    it('should clear the interval if it exists', async () => {
      await simulationTimer.run();
      expect(simulationTimer.interval).not.toBeNull();

      await simulationTimer.reset();
      expect(simulationTimer.interval).toBeNull();
    });

    it('should not throw error if interval is null', async () => {
      simulationTimer.interval = null;
      
      await expect(simulationTimer.reset()).resolves.not.toThrow();
    });

    it('should stop the timer from ticking after reset', async () => {
      await simulationTimer.run();
      await simulationTimer.reset();

      const dayBefore = simulationTimer.daysSinceStart;
      jest.advanceTimersByTime(120000);
      
      expect(simulationTimer.daysSinceStart).toBe(dayBefore);
    });
  });

  describe('resume', () => {
    it('should restore date from provided string', async () => {
      await simulationTimer.resume('2050-03-15');

      expect(simulationTimer.dayOfMonth).toBe(15);
      expect(simulationTimer.month).toBe(3);
      expect(simulationTimer.year).toBe(2050);
    });

    it('should calculate correct days since start', async () => {
      await simulationTimer.resume('2050-02-15');

      // From Jan 1 to Feb 15: 30 + 14 = 44 days
      expect(simulationTimer.daysSinceStart).toBe(44);
    });

    it('should run all jobs', async () => {
      await simulationTimer.resume('2050-02-15');

      expect(mockDecisionEngine.run).toHaveBeenCalledTimes(1);
      expect(mockSimulateProduction.run).toHaveBeenCalledTimes(1);
      expect(mockCancelUnpaidOrdersJob.run).toHaveBeenCalledTimes(1);
    });

    it('should start the interval', async () => {
      await simulationTimer.resume('2050-02-15');

      expect(simulationTimer.interval).not.toBeNull();
    });

    it('should handle different date formats correctly', async () => {
      await simulationTimer.resume('2051-12-30');

      expect(simulationTimer.dayOfMonth).toBe(30);
      expect(simulationTimer.month).toBe(12);
      expect(simulationTimer.year).toBe(2051);
    });
  });
});
