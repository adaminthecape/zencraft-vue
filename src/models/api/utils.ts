import { ApiHandler } from "./ApiInterface";

export function getLocalJwt(): string
{
	return localStorage.getItem('jwt') || '';
}

export function updateLocalJwt(value: string): void
{
	localStorage.setItem('jwt', value);
}

export function getLocalFirebaseCreds(): ({
  username: string;
  password: string;
} | undefined)
{
	const stored = localStorage.getItem('user_account');

	try
	{
		if(stored)
		{
			return JSON.parse(stored);
		}
	}
	catch(e)
	{
		return undefined;
	}
}

export async function getIsJwtExpired(): Promise<boolean>
{
	const jwt = getLocalJwt();

	if(!jwt)
	{
		return true;
	}

	// test basic API access
	const api = new ApiHandler({ jwt });

	const res = await api.GET('/session/current');

	return (!(res?.data as Record<string, unknown>)?.sessionId);
}
