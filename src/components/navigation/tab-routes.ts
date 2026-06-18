import { domainIcons } from './domain-icons';

export const tabRoutes = [
  { name: 'index', title: 'Home', titleKey: 'tabs.home', icon: domainIcons.home },
  { name: 'library', title: 'Library', titleKey: 'tabs.library', icon: domainIcons.library },
  { name: 'reading', title: 'Reading', titleKey: 'tabs.reading', icon: domainIcons.reading },
  { name: 'lists', title: 'Lists', titleKey: 'tabs.lists', icon: domainIcons.lists },
  { name: 'settings', title: 'Settings', titleKey: 'tabs.settings', icon: domainIcons.settings },
] as const;
