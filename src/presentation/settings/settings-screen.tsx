import { Alert, Platform, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n } from '@/src/localization/i18n';
import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Badge, Button, Card, Divider } from '@/src/components/ui';
import { useApplication, useAppTheme, useLocalization } from '@/src/presentation';
import type { SupportedLocale } from '@/src/localization/locale-types';
import type { ThemeMode } from '@/src/theme';

import { useSettingsScreen } from './settings-controller';
import type {
  BackupSummaryViewModel,
  DriveBackupViewModel,
  LocalBackupViewModel,
  SettingsViewModel,
} from './settings-types';

const appearanceOptions: { mode: ThemeMode; labelKey: string }[] = [
  { mode: 'system', labelKey: 'settings.appearance.system' },
  { mode: 'light', labelKey: 'settings.appearance.light' },
  { mode: 'dark', labelKey: 'settings.appearance.dark' },
];

const languageOptions: { locale: SupportedLocale; labelKey: string }[] = [
  { locale: 'en', labelKey: 'settings.language.english' },
  { locale: 'pt-BR', labelKey: 'settings.language.portuguese' },
];

export function SettingsScreen() {
  const application = useApplication();
  const appearance = useAppTheme();
  const { t } = useTranslation();

  if (!application.api) return <Screen loading loadingMessage={t('settings.loading')} />;

  return (
    <SettingsScreenContent
      backupApi={application.api.backup}
      appearance={{
        mode: appearance.mode,
        resolvedMode: appearance.resolvedMode,
        setMode: appearance.setMode,
      }}
      reloadApplication={application.reload}
    />
  );
}

function SettingsScreenContent({
  backupApi,
  appearance,
  reloadApplication,
}: Parameters<typeof useSettingsScreen>[0]) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useSettingsScreen({ backupApi, appearance, reloadApplication });
  const loading = state.status === 'idle' || state.status === 'loading';

  if (loading) return <Screen loading loadingMessage={t('settings.loading')} />;

  if (state.status === 'error') {
    return (
      <Screen header={<AppHeader title={t('tabs.settings')} subtitle={t('settings.subtitle')} />}>
        <ErrorState title={t('settings.loadErrorTitle')} description={state.error ?? t('errors.generic')} actionLabel={t('common.actions.retry')} onAction={state.retry} />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={state.refreshing}
          onRefresh={state.refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      header={<AppHeader title={t('tabs.settings')} subtitle={t('settings.subtitle')} />}>
      {state.error ? <ErrorState title={t('settings.actionErrorTitle')} description={state.error} actionLabel={t('common.actions.dismiss')} onAction={state.refresh} /> : null}
      {state.message ? (
        <Card variant="outlined">
          <AppText color="textSecondary">{state.message}</AppText>
        </Card>
      ) : null}

      <AppearanceSection viewModel={state.viewModel} submitting={state.submitting} onSelect={state.setAppearanceMode} />
      <LanguageSection />
      <LocalBackupSection
        backups={state.viewModel.localBackups}
        submitting={state.submitting}
        onCreate={state.createLocalBackup}
        onImport={state.importLocalBackup}
        onShare={state.shareLocalBackup}
        onDelete={(backup) => confirmDestructive(
          t('settings.backup.deleteLocalTitle'),
          t('settings.backup.deleteLocalDescription'),
          () => state.deleteLocalBackup(backup.uri),
        )}
      />
      {state.pendingSummary ? (
        <PendingRestoreCard
          summary={state.pendingSummary}
          submitting={state.submitting}
          onRestore={() => confirmDestructive(
            t('settings.backup.restoreTitle'),
            t('settings.backup.restoreDescription'),
            state.restorePendingBackup,
          )}
        />
      ) : null}
      <GoogleDriveSection
        viewModel={state.viewModel}
        submitting={state.submitting}
        onConnect={state.connectDrive}
        onDisconnect={() => confirmDestructive(
          t('settings.drive.disconnectTitle'),
          t('settings.drive.disconnectDescription'),
          state.disconnectDrive,
        )}
        onUpload={state.uploadDriveBackup}
        onRefresh={state.refreshDriveBackups}
        onDownload={state.downloadDriveBackup}
        onDelete={(backup) => confirmDestructive(
          t('settings.drive.deleteTitle'),
          t('settings.drive.deleteDescription'),
          () => state.deleteDriveBackup(backup.id),
        )}
      />
      <ApplicationSection viewModel={state.viewModel} />
    </Screen>
  );
}

function LanguageSection() {
  const { theme } = useAppTheme();
  const { locale, setLocale } = useLocalization();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader
        title={t('settings.language.title')}
        description={t('settings.language.description')}
      />
      <Card variant="outlined">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {languageOptions.map((option) => (
            <Button
              key={option.locale}
              title={t(option.labelKey)}
              variant={locale === option.locale ? 'secondary' : 'outline'}
              accessibilityLabel={t('settings.language.accessibility', {
                language: t(option.labelKey),
                selected: locale === option.locale ? `, ${t('common.selected')}` : '',
              })}
              onPress={() => {
                void setLocale(option.locale);
              }}
            />
          ))}
        </View>
      </Card>
    </View>
  );
}

function AppearanceSection({
  viewModel,
  submitting,
  onSelect,
}: {
  viewModel: SettingsViewModel;
  submitting: boolean;
  onSelect: (mode: ThemeMode) => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader
        title={t('settings.appearance.title')}
        description={t('settings.appearance.resolved', { mode: t(`settings.appearance.${viewModel.appearance.resolvedMode}`) })}
      />
      <Card variant="outlined">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {appearanceOptions.map((option) => {
            const label = t(option.labelKey);
            const selected = viewModel.appearance.selectedMode === option.mode;
            return (
              <Button
                key={option.mode}
                title={label}
                variant={selected ? 'secondary' : 'outline'}
                accessibilityLabel={t('settings.appearance.accessibility', {
                  mode: label,
                  selected: selected ? `, ${t('common.selected')}` : '',
                })}
                disabled={submitting}
                onPress={() => onSelect(option.mode)}
              />
            );
          })}
        </View>
      </Card>
    </View>
  );
}

function LocalBackupSection({
  backups,
  submitting,
  onCreate,
  onImport,
  onShare,
  onDelete,
}: {
  backups: LocalBackupViewModel[];
  submitting: boolean;
  onCreate: () => void;
  onImport: () => void;
  onShare: (uri: string) => void;
  onDelete: (backup: LocalBackupViewModel) => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={t('settings.backup.localTitle')} description={t('settings.backup.fileCount', { count: backups.length })} />
      <Card variant="outlined">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          <Button title={t('settings.backup.create')} loading={submitting} onPress={onCreate} />
          <Button title={t('settings.backup.import')} variant="outline" disabled={submitting} onPress={onImport} />
        </View>
      </Card>
      {backups.length > 0 ? backups.map((backup) => (
        <BackupFileCard
          key={backup.uri}
          backup={backup}
          submitting={submitting}
          onShare={() => onShare(backup.uri)}
          onDelete={() => onDelete(backup)}
        />
      )) : (
        <Card variant="outlined">
          <EmptyState icon="archive-outline" title={t('settings.backup.emptyLocalTitle')} description={t('settings.backup.emptyLocalDescription')} />
        </Card>
      )}
    </View>
  );
}

function BackupFileCard({
  backup,
  submitting,
  onShare,
  onDelete,
}: {
  backup: LocalBackupViewModel;
  submitting: boolean;
  onShare: () => void;
  onDelete: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <AppText variant="heading3">{backup.name}</AppText>
      <AppText color="textSecondary">{backup.createdDateLabel} - {backup.sizeLabel}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <Button title={t('common.actions.share')} variant="outline" disabled={submitting} onPress={onShare} />
        <Button title={t('common.actions.delete')} variant="danger" disabled={submitting} onPress={onDelete} />
      </View>
    </Card>
  );
}

function PendingRestoreCard({
  summary,
  submitting,
  onRestore,
}: {
  summary: BackupSummaryViewModel;
  submitting: boolean;
  onRestore: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <AppText variant="heading3">{summary.title}</AppText>
      <SettingsRow label={t('settings.backup.exported')} value={summary.exportedAtLabel} />
      <SettingsRow label={t('settings.backup.format')} value={summary.formatVersionLabel} />
      <SettingsRow label={t('settings.backup.schema')} value={summary.schemaVersionLabel} />
      <AppText color="textSecondary">{summary.countsLabel}</AppText>
      <AppText color="textSecondary">{t('settings.backup.restoreDescription')}</AppText>
      <Button title={t('settings.backup.restoreAction')} variant="danger" loading={submitting} onPress={onRestore} />
    </Card>
  );
}

function GoogleDriveSection({
  viewModel,
  submitting,
  onConnect,
  onDisconnect,
  onUpload,
  onRefresh,
  onDownload,
  onDelete,
}: {
  viewModel: SettingsViewModel;
  submitting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onUpload: () => void;
  onRefresh: () => void;
  onDownload: (fileId: string) => void;
  onDelete: (backup: DriveBackupViewModel) => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const connected = viewModel.drive.state === 'connected';

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={t('settings.drive.title')} description={viewModel.drive.statusLabel} />
      <Card variant="outlined">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
          <AppText variant="heading3">{t('settings.drive.connection')}</AppText>
          <Badge label={viewModel.drive.statusLabel} variant={connected ? 'active' : 'default'} />
        </View>
        {viewModel.drive.expiresAtLabel ? (
          <AppText color="textSecondary">{t('settings.drive.sessionExpires', { date: viewModel.drive.expiresAtLabel })}</AppText>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {connected ? (
            <>
              <Button title={t('settings.drive.upload')} loading={submitting} onPress={onUpload} />
              <Button title={t('settings.drive.refresh')} variant="outline" disabled={submitting} onPress={onRefresh} />
              <Button title={t('settings.drive.disconnect')} variant="danger" disabled={submitting} onPress={onDisconnect} />
            </>
          ) : (
            <Button title={t('settings.drive.connect')} loading={submitting || viewModel.drive.state === 'connecting'} onPress={onConnect} />
          )}
        </View>
      </Card>
      {connected ? (
        viewModel.drive.backups.length > 0 ? viewModel.drive.backups.map((backup) => (
          <DriveBackupCard
            key={backup.id}
            backup={backup}
            submitting={submitting}
            onDownload={() => onDownload(backup.id)}
            onDelete={() => onDelete(backup)}
          />
        )) : (
          <Card variant="outlined">
            <EmptyState icon="cloud-outline" title={t('settings.drive.emptyTitle')} description={t('settings.drive.emptyDescription')} />
          </Card>
        )
      ) : null}
    </View>
  );
}

function DriveBackupCard({
  backup,
  submitting,
  onDownload,
  onDelete,
}: {
  backup: DriveBackupViewModel;
  submitting: boolean;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <AppText variant="heading3">{backup.name}</AppText>
      <SettingsRow label={t('settings.backup.date')} value={backup.dateLabel} />
      <SettingsRow label={t('settings.backup.size')} value={backup.sizeLabel} />
      <SettingsRow label={t('settings.backup.formatVersion')} value={backup.formatVersionLabel} />
      <SettingsRow label={t('settings.backup.schemaVersion')} value={backup.schemaVersionLabel} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <Button title={t('common.actions.download')} variant="outline" disabled={submitting} onPress={onDownload} />
        <Button title={t('common.actions.delete')} variant="danger" disabled={submitting} onPress={onDelete} />
      </View>
    </Card>
  );
}

function ApplicationSection({ viewModel }: { viewModel: SettingsViewModel }) {
  const { t } = useTranslation();

  return (
    <View>
      <SectionHeader title={t('settings.application.title')} />
      <Card variant="outlined">
        <SettingsRow label={t('settings.application.appName')} value={viewModel.application.appName} />
        <Divider />
        <SettingsRow label={t('settings.application.version')} value={viewModel.application.version} />
        <Divider />
        <SettingsRow label={t('settings.application.buildNumber')} value={viewModel.application.buildNumber} />
        <Divider />
        <SettingsRow label={t('settings.application.databaseSchemaVersion')} value={viewModel.application.databaseSchemaVersion} />
        <Divider />
        <SettingsRow label={t('settings.application.backupFormatVersion')} value={viewModel.application.backupFormatVersion} />
        <Divider />
        <AppText color="textSecondary">{viewModel.application.privacyNote}</AppText>
      </Card>
    </View>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
      <AppText color="textSecondary">{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

function confirmDestructive(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: String(i18n.t('common.actions.cancel')), style: 'cancel' },
    { text: String(i18n.t('common.actions.confirm')), style: 'destructive', onPress: onConfirm },
  ]);
}
