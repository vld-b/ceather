export function formatTime(num: number) {
    if (num.toString().length === 1) {
      return ("0" + num.toString()).toString();
    } else {
      return num.toString();
    }
  }