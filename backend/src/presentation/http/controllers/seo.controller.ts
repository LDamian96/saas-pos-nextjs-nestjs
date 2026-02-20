import { Controller, Get, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SeoService } from '../../../core/application/services/seo.service';
import { UpsertSeoDto } from '../../../core/application/dto/seo';

@Controller('seo')
@UseGuards(JwtAuthGuard)
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get()
  async findAll(@Req() req) {
    const empresaId = req.user.empresaId;
    const data = await this.seoService.findAll(empresaId);
    return { success: true, data };
  }

  @Get(':pagina')
  async findByPagina(@Req() req, @Param('pagina') pagina: string) {
    const empresaId = req.user.empresaId;
    const data = await this.seoService.findByPagina(empresaId, pagina);
    return { success: true, data };
  }

  @Put(':pagina')
  async upsert(@Req() req, @Param('pagina') pagina: string, @Body() body: UpsertSeoDto) {
    const empresaId = req.user.empresaId;
    const data = await this.seoService.upsert(empresaId, pagina, body);
    return { success: true, data };
  }

  @Delete(':pagina')
  async delete(@Req() req, @Param('pagina') pagina: string) {
    const empresaId = req.user.empresaId;
    await this.seoService.delete(empresaId, pagina);
    return { success: true, message: 'Configuracion SEO eliminada' };
  }
}
