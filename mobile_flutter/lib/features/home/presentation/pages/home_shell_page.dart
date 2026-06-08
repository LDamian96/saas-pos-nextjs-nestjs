// =============================================================================
// home_shell_page.dart
// Shell con bottom navigation. Mantiene 4 tabs vivas (IndexedStack) y aplica
// transiciones suaves al cambiar de tab.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';
import 'package:pos_mobile/features/cash/presentation/pages/cash_page.dart';
import 'package:pos_mobile/features/home/presentation/pages/dashboard_page.dart';
import 'package:pos_mobile/features/products/presentation/pages/products_page.dart';
import 'package:pos_mobile/features/sales/presentation/pages/sales_page.dart';
import 'package:pos_mobile/features/settings/presentation/pages/more_page.dart';

class _Tab {
  const _Tab({
    required this.icon,
    required this.label,
    required this.page,
  });
  final IconData icon;
  final String label;
  final Widget page;
}

class HomeShellPage extends StatefulWidget {
  const HomeShellPage({super.key});

  @override
  State<HomeShellPage> createState() => _HomeShellPageState();
}

class _HomeShellPageState extends State<HomeShellPage> {
  int _index = 0;

  final _tabs = const [
    _Tab(
      icon: LucideIcons.layoutDashboard,
      label: 'Inicio',
      page: DashboardPage(),
    ),
    _Tab(
      icon: LucideIcons.shoppingCart,
      label: 'Vender',
      page: SalesPage(),
    ),
    _Tab(
      icon: LucideIcons.package,
      label: 'Productos',
      page: ProductsPage(),
    ),
    _Tab(
      icon: LucideIcons.wallet,
      label: 'Caja',
      page: CashPage(),
    ),
    _Tab(
      icon: LucideIcons.settings2,
      label: 'Más',
      page: MorePage(),
    ),
  ];

  void _select(int i) {
    if (i == _index) return;
    HapticFeedback.selectionClick();
    setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      backgroundColor: context.isDark ? AppColors.darkBg : AppColors.lightBg,
      body: IndexedStack(
        index: _index,
        children: [
          for (final t in _tabs) t.page,
        ],
      ),
      bottomNavigationBar: _BottomNav(
        tabs: _tabs,
        index: _index,
        onSelect: _select,
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  const _BottomNav({
    required this.tabs,
    required this.index,
    required this.onSelect,
  });

  final List<_Tab> tabs;
  final int index;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
        child: Container(
          height: 68,
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurfaceAlt : AppColors.lightSurface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: context.colors.outline, width: 0.6),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadowMedium,
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Row(
            children: [
              for (int i = 0; i < tabs.length; i++)
                Expanded(
                  child: _NavItem(
                    tab: tabs[i],
                    active: i == index,
                    onTap: () => onSelect(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.tab,
    required this.active,
    required this.onTap,
  });

  final _Tab tab;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active
        ? AppColors.brand
        : context.colors.onSurface.withValues(alpha: 0.55);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: active ? AppColors.brandSoft : Colors.transparent,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(tab.icon, size: 20, color: color)
                    .animate(key: ValueKey(active))
                    .scale(
                      begin: active
                          ? const Offset(0.9, 0.9)
                          : const Offset(1, 1),
                      end: const Offset(1, 1),
                      duration: 220.ms,
                      curve: Curves.easeOutBack,
                    ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOutCubic,
                  child: active
                      ? Padding(
                          padding: const EdgeInsets.only(left: 6),
                          child: Text(
                            tab.label,
                            style: TextStyle(
                              color: color,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
