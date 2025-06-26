import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

const mockRecommendationsService = {
  getUserRecommendations: jest.fn(),
};

describe('RecommendationsController', () => {
  let controller: RecommendationsController;
  let service: RecommendationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationsController],
      providers: [
        {
          provide: RecommendationsService,
          useValue: mockRecommendationsService,
        },
      ],
    }).compile();

    controller = module.get<RecommendationsController>(
      RecommendationsController,
    );
    service = module.get<RecommendationsService>(RecommendationsService);
    jest.clearAllMocks();
  });

  it('should call service and return recommendations', async () => {
    const mockReq = { user: { userId: 42 } };
    const mockResult = [{ id: 1 }, { id: 2 }];
    mockRecommendationsService.getUserRecommendations.mockResolvedValueOnce(
      mockResult,
    );
    const result = await controller.getUserRecommendations(mockReq, '5');
    expect(service.getUserRecommendations).toHaveBeenCalledWith(42, 5);
    expect(result).toBe(mockResult);
  });

  it('should use default limit if not provided', async () => {
    const mockReq = { user: { userId: 7 } };
    const mockResult = [{ id: 3 }];
    mockRecommendationsService.getUserRecommendations.mockResolvedValueOnce(
      mockResult,
    );
    const result = await controller.getUserRecommendations(mockReq);
    expect(service.getUserRecommendations).toHaveBeenCalledWith(7, 10);
    expect(result).toBe(mockResult);
  });
});
