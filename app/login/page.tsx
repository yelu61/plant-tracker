import { Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/", error } = await searchParams;
  const noPassword = !process.env.APP_PASSWORD;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 pb-0">
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Sprout className="h-6 w-6 text-leaf-600" />
          <h1 className="text-xl font-semibold">植语</h1>
        </div>
        {noPassword ? (
          <p className="text-sm text-amber-700">
            未设置 <code>APP_PASSWORD</code> 环境变量，应用当前不需要口令。
          </p>
        ) : (
          <p className="text-sm text-stone-600">输入访问口令</p>
        )}
        <form method="post" action="/api/auth/login" className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <Input
            type="password"
            name="password"
            required={!noPassword}
            disabled={noPassword}
            autoFocus
            placeholder="口令"
          />
          {error ? <p className="text-xs text-rose-600">口令不对，再试一次</p> : null}
          <Button type="submit" className="w-full" disabled={noPassword}>
            {noPassword ? "无需口令" : "解锁"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
