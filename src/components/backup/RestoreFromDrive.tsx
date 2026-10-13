import type { BootstrapState } from '../../store';

type Props = {
  onRestored: (state: BootstrapState) => void;
};

/** Non-Android: nothing to offer on the welcome screen. */
export function RestoreFromDrive(_props: Props) {
  return null;
}
