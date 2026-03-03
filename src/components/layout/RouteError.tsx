import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RouteError() {
  const error = useRouteError();

  let message = "页面渲染失败";
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="m-4 rounded-md border bg-card p-4 text-sm">
      <p className="font-semibold text-red-500">网页飞到火星上了 O.o</p>
      <p className="mt-2 text-muted-foreground">{message}</p>
    </div>
  );
}
