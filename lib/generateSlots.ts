export function generateTimeSlots(params: {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  stepMinutes?: number;
  selectedDate: string; // YYYY-MM-DD
}) {
  const {
    startTime,
    endTime,
    durationMinutes,
    stepMinutes = 30,
    selectedDate,
  } = params;

  if (!startTime || !endTime) return [];

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  if (startTotal >= endTotal) return [];

  const today = new Date();
  const selected = new Date(`${selectedDate}T00:00:00`);

  const isToday =
    today.getFullYear() === selected.getFullYear() &&
    today.getMonth() === selected.getMonth() &&
    today.getDate() === selected.getDate();

  const nowMinutes = today.getHours() * 60 + today.getMinutes();

  const slots: string[] = [];

  for (
    let current = startTotal;
    current + durationMinutes <= endTotal;
    current += stepMinutes
  ) {
    if (isToday && current <= nowMinutes) {
      continue;
    }

    const hour = Math.floor(current / 60)
      .toString()
      .padStart(2, "0");
    const minute = (current % 60).toString().padStart(2, "0");

    slots.push(`${hour}:${minute}`);
  }

  return slots;
}