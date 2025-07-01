export function convertTimestampToDateTime(timestamp: number): ({
  date: string;
  time: string;
} | undefined)
{
	if(typeof timestamp === 'string')
	{
		if(`${parseInt(timestamp, 10)}` !== timestamp)
		{
			return undefined;
		}

		timestamp = parseInt(timestamp, 10);
	}

	const { year, month, day, hour, minute } = getDateParts(
		`${timestamp}`.length > 10 ? timestamp : timestamp * 1000
	);

	return {
		date: `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`,
		time: `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`
	};
}

export function convertDateTimeToTimestamp(opts: {
  date?: string;
  time?: string;
}): number | undefined
{
	if(!opts.date && !opts.time)
	{
		return undefined;
	}

	const date = opts.date || new Date().toISOString().split('T').shift();
	const time = opts.time || '00:00';

	const result = Math.floor(new Date(`${date} ${time}`).getTime() / 1000);

	if(Number.isNaN(result))
	{
		return undefined;
	}

	return result;
}

export function getDateParts(dt: Date | string | number): ({
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
})
{
	if(!dt)
	{
		dt = new Date();
	}
	else if(typeof dt === 'string' && `${parseInt(dt, 10)}` === dt)
	{
		dt = new Date(parseInt(dt, 10));
	}
	else if(!(dt instanceof Date))
	{
		dt = new Date(dt);
	}

	return {
		year: dt.getFullYear(),
		month: dt.getMonth() + 1,
		day: dt.getDate(),
		hour: dt.getHours(),
		minute: dt.getMinutes(),
		second: dt.getSeconds(),
	};
}

export function getSecondsFromDateAndTime(opts: {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
}): number
{
	const { year, month, day, hour, minute, second } = opts;

	const date = [year, month, day].map((x) => `${x}`.padStart(2, '0')).join('-');
	const time = (
		second ? [hour, minute, second] : [hour, minute]
	).map((x) => `${x}`.padStart(2, '0')).join(':');

	const stringValue = (hour && minute) ? `${date} ${time}` : date;

	const dt = new Date(stringValue);

	return Math.floor(dt.getTime() / 1000);
}
