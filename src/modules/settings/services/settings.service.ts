import prisma from '@/lib/prisma';

export class SettingsService {
  async getSettings() {
    const settings = await prisma.systemSetting.findMany();
    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async getSetting(key: string, defaultValue: string = ''): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value ?? defaultValue;
  }

  async updateSettings(settings: Record<string, string>) {
    const queries = Object.entries(settings).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });
    await prisma.$transaction(queries);
    return true;
  }
}

export const settingsService = new SettingsService();
