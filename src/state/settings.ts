import { useEffect, useState } from 'react';
import { setSoundEnabled } from '../lib/sound';

export interface DeviceSettings {
  sound: boolean;
  showPointNumbers: boolean;
}

const KEY = 'nardy.settings';
const DEFAULTS: DeviceSettings = { sound: true, showPointNumbers: false };

function read(): DeviceSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/** Sound and board preferences belong to the device, not the room. */
export function useDeviceSettings() {
  const [settings, setSettings] = useState<DeviceSettings>(read);

  useEffect(() => {
    setSoundEnabled(settings.sound);
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* private mode — preferences just will not persist */
    }
  }, [settings]);

  const toggle = (key: keyof DeviceSettings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  return { settings, toggle };
}
