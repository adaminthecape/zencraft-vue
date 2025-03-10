export function printCleanStack(title?: string)
{
  const obj: { stack?: string; } = {};

  Error.stackTraceLimit = 100;
  Error.captureStackTrace(obj);
  Error.stackTraceLimit = 10;

  const stack = obj.stack?.split('\n').slice(2).filter((s) => (
    !s.includes('node_hubs') &&
    !s.includes('webpack') &&
    !s.includes('callWithErrorHandling') &&
    !s.includes('callWithAsyncErrorHandling')
  ));

  console.log(title || 'stack', '\n', stack?.join('\n'));
}
