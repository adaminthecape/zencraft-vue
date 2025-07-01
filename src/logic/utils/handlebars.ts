
export function stepArgs(args: unknown[], stepLength = 2): Record<string, unknown>
{
	const results: Record<string, unknown> = {};

	for(let i = 0; i < args.length; i += stepLength)
	{
		if(typeof args[i] !== 'string')
		{
			break;
		}

		results[args[i] as string] = args[i + 1];
	}

	return results;
}

export function pluckArg(arg: string): { value: unknown, endChar: number; }
{
	// start with first char in string
	const first = arg.slice(0, 1);

	if(!first)
	{
		return {
			value: undefined,
			endChar: 0,
		};
	}

	let needle;

	let end = 0;

	let derived;

	if(['\'', '"'].includes(first))
	{
		needle = first;
		end = arg.indexOf(needle, 1) + 1;
		derived = (arg.slice(1, end - 1));
	}
	else if(first === '(')
	{
		needle = ')';
		end = arg.indexOf(needle) + 1;
		derived = (parseArgs(arg.slice(1, end - 1)));
	}
	else if(`${parseInt(arg, 10)}` == arg)
	{
		derived = (parseInt(arg, 10));
	}
	else if(arg === 'true')
	{
		derived = (true);
	}
	else if(arg === 'false')
	{
		derived = (false);
	}
	else if(arg === 'null')
	{
		derived = (null);
	}
	else
	{
		needle = ' ';
		end = arg.indexOf(needle);

		if(end === -1)
		{
			end = arg.length;
		}

		derived = `{{${arg.slice(0, end)}}}`;
	}

	return {
		value: derived,
		endChar: end,
	};
}

export function parseArgs(args: string): unknown[]
{
	const results: unknown[] = [];
	let nextArg;

	const pluck = () =>
	{
		const { value, endChar } = pluckArg(args);

		if(value)
		{
			args = args.slice(endChar ?? 0).trim();

			results.push(value);

			return value;
		}

		return undefined;
	};

	do
	{
		nextArg = pluck();
	}
	while(nextArg);

	return results;
}
