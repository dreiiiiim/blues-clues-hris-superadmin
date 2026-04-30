import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    // 1. Validate email + password via Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email: dto.email, password: dto.password });

    if (authError || !authData.user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Check super_admin role in user_metadata
    const role = authData.user.user_metadata?.role;
    if (role !== 'super_admin') {
      throw new UnauthorizedException('Access denied — not a super admin');
    }

    // 3. Fetch name from super_admin_users table
    const { data: adminUser, error: dbError } = await supabase
      .from('super_admin_users')
      .select('id, email, name')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (dbError || !adminUser) {
      throw new UnauthorizedException('Super admin record not found');
    }

    // 4. Sign JWT
    const payload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: 'super_admin' as const,
      name: adminUser.name,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '8h',
    });

    return { access_token, user: { id: adminUser.id, email: adminUser.email, name: adminUser.name } };
  }
}
