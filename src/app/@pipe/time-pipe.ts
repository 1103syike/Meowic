import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'time',
})
export class TimePipe implements PipeTransform {
  transform(songLength: string | number): string | number {
    return typeof songLength === 'string'
      ? transformTimeToSecond(songLength)
      : transformSecondToTime(songLength);
  }
}

function transformTimeToSecond(songLength: string): number {
  return songLength.split(':').map((e) => +e)[0] * 60 + songLength.split(':').map((e) => +e)[1];
}
function transformSecondToTime(songSecond: number): string {
  const min = Math.floor(songSecond / 60);
  let sec;
  if (`${songSecond % 60}`.length === 1) {
    sec = `0${songSecond % 60}`;
  } else {
    sec = songSecond % 60;
  }
  return `${min}:${sec}`;
}
