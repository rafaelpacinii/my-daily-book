export async function runDriveConnectAction({
  connect,
  setDriveTransient,
  setMessage,
  refresh,
  successMessage,
}: {
  connect: () => Promise<unknown>;
  setDriveTransient: (state: 'connecting' | null) => void;
  setMessage: (message: string | null) => void;
  refresh: () => void;
  successMessage: string;
}): Promise<void> {
  setDriveTransient('connecting');

  try {
    await connect();
    setMessage(successMessage);
    refresh();
  } finally {
    setDriveTransient(null);
  }
}
