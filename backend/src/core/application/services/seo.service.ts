import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  async findAll(empresaId: string) {
    return this.prisma.seoConfig.findMany({
      where: { empresaId },
      orderBy: { pagina: 'asc' },
    });
  }

  async findByPagina(empresaId: string, pagina: string) {
    return this.prisma.seoConfig.findUnique({
      where: { empresaId_pagina: { empresaId, pagina } },
    });
  }

  async upsert(empresaId: string, pagina: string, data: any) {
    return this.prisma.seoConfig.upsert({
      where: { empresaId_pagina: { empresaId, pagina } },
      create: {
        empresaId,
        pagina,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        ogImage: data.ogImage,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        canonicalUrl: data.canonicalUrl,
        robotsTxt: data.robotsTxt,
        sitemapActivo: data.sitemapActivo ?? true,
      },
      update: {
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        ogImage: data.ogImage,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        canonicalUrl: data.canonicalUrl,
        robotsTxt: data.robotsTxt,
        sitemapActivo: data.sitemapActivo,
      },
    });
  }

  async delete(empresaId: string, pagina: string) {
    return this.prisma.seoConfig.deleteMany({
      where: { empresaId, pagina },
    });
  }
}
