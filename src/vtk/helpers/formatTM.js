/*
 * @Author: your name
 * @Date: 2021-03-09 17:03:05
 * @LastEditTime: 2021-03-10 17:00:14
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \deepln-dazhou-new\src\vtk\helpers\formatTM.js
 */
import { parse, format } from 'date-fns';

export default function formatTM(time, strFormat = 'HH:mm:ss') {
  if (!time) {
    return;
  }

  try {
    const inputFormat = 'HHmmss.SSS';
    const strTime = time.toString().substring(0, inputFormat.length);
    const parsedDateTime = parse(strTime, 'HHmmss.SSS', new Date(0));
    const formattedDateTime = format(parsedDateTime, strFormat);

    return formattedDateTime;
  } catch (err) {
    // swallow?
  }

  //return format(parsedDateTime, strFormat);
}
