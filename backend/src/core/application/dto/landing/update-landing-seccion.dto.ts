import { PartialType } from '@nestjs/mapped-types';
import { CreateLandingSeccionDto } from './create-landing-seccion.dto';

export class UpdateLandingSeccionDto extends PartialType(CreateLandingSeccionDto) {}
