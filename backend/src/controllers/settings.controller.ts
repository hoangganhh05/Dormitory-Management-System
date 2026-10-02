import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class SettingsController {
  static async getPublicSettings(_req: Request, res: Response): Promise<void> {
    try {
      const settings = await prisma.dormitorySetting.findMany({
        orderBy: { key: 'asc' },
        select: { key: true, value: true },
      });

      const data = settings.reduce<Record<string, string>>((result, setting) => {
        result[setting.key] = setting.value;
        return result;
      }, {});

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('[SettingsController.getPublicSettings Error]', error);
      res.status(500).json({
        success: false,
        message: 'Không thể tải cấu hình KTX',
        data: {},
      });
    }
  }
}
