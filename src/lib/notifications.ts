export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};
