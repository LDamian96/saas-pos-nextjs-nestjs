// =============================================================================
// toast_service.dart
// Wrapper sobre toastification. Punto único para feedback al usuario.
// Estilo consistente: bottom-center, glassmorphism suave, iconos coloreados,
// auto-dismiss 2.5s por defecto.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:toastification/toastification.dart';

final toastServiceProvider = Provider<ToastService>((ref) => ToastService());

class ToastService {
  /// ✅ Acción completada con éxito.
  ToastificationItem success(
    BuildContext context, {
    required String message,
    String? title,
    Duration? duration,
  }) {
    return _show(
      context,
      title: title ?? 'Listo',
      message: message,
      icon: LucideIcons.checkCheck,
      iconColor: AppColors.success,
      duration: duration,
    );
  }

  /// ❌ Algo falló. Se muestra MÁS tiempo (3.5s) para que el usuario lea.
  ToastificationItem error(
    BuildContext context, {
    required String message,
    String? title,
    Duration? duration,
  }) {
    return _show(
      context,
      title: title ?? 'Algo salió mal',
      message: message,
      icon: LucideIcons.circleAlert,
      iconColor: AppColors.danger,
      duration: duration ?? const Duration(milliseconds: 3500),
    );
  }

  /// ⚠️ Atención del usuario (sin bloquear).
  ToastificationItem warning(
    BuildContext context, {
    required String message,
    String? title,
    Duration? duration,
  }) {
    return _show(
      context,
      title: title ?? 'Atención',
      message: message,
      icon: LucideIcons.triangleAlert,
      iconColor: AppColors.warning,
      duration: duration,
    );
  }

  /// ℹ️ Información neutral.
  ToastificationItem info(
    BuildContext context, {
    required String message,
    String? title,
    Duration? duration,
  }) {
    return _show(
      context,
      title: title ?? 'Aviso',
      message: message,
      icon: LucideIcons.info,
      iconColor: AppColors.info,
      duration: duration,
    );
  }

  /// 🔄 Loading persistente. Devuelve función para cerrarlo manualmente.
  ToastificationItem loading(BuildContext context, {required String message}) {
    return toastification.show(
      context: context,
      type: ToastificationType.info,
      style: ToastificationStyle.flatColored,
      autoCloseDuration: null,
      alignment: Alignment.bottomCenter,
      direction: TextDirection.ltr,
      title: Text(message),
      icon: const SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation(AppColors.brand),
        ),
      ),
      borderRadius: BorderRadius.circular(16),
      boxShadow: const [
        BoxShadow(
          color: AppColors.shadowMedium,
          blurRadius: 24,
          offset: Offset(0, 8),
        ),
      ],
      animationDuration: const Duration(milliseconds: 280),
      showProgressBar: false,
    );
  }

  /// Cierra un toast por su item.
  void dismiss(ToastificationItem item) => toastification.dismiss(item);

  /// Cierra todos los toasts visibles.
  void dismissAll() => toastification.dismissAll();

  ToastificationItem _show(
    BuildContext context, {
    required String title,
    required String message,
    required IconData icon,
    required Color iconColor,
    Duration? duration,
  }) {
    return toastification.show(
      context: context,
      type: ToastificationType.custom('pos_$title', iconColor, icon),
      style: ToastificationStyle.flat,
      autoCloseDuration: duration ?? const Duration(milliseconds: 2500),
      alignment: Alignment.bottomCenter,
      direction: TextDirection.ltr,
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
      ),
      description: Text(
        message,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
      ),
      icon: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: iconColor.withValues(alpha: 0.18)),
      boxShadow: const [
        BoxShadow(
          color: AppColors.shadowMedium,
          blurRadius: 24,
          offset: Offset(0, 10),
        ),
      ],
      animationDuration: const Duration(milliseconds: 300),
      showProgressBar: false,
      dragToClose: true,
      pauseOnHover: true,
      closeOnClick: true,
    );
  }
}
