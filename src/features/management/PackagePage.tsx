import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { confirm } from "@/components/ui/confirm";
import { apiFetch } from "@/lib/api";

type TargetType = "plugin" | "service";

export function PackagePage({ target }: { target: TargetType }) {
  const [items, setItems] = useState<any[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [packageManager, setPackageManager] = useState("bun");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const endpoint =
        target === "plugin" ? "/api/manage/plugins" : "/api/manage/services";
      const res = await apiFetch<any>(endpoint);
      setItems(res.data || []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "加载列表失败");
    }
  };

  useEffect(() => {
    load().then();
  }, [target]);

  const install = async () => {
    const targetLabel = target === "plugin" ? "插件" : "服务";
    const ok = await confirm({
      title: `安装${targetLabel}`,
      message: `确认从以下地址安装${targetLabel}？\n${repoUrl}`,
      confirmText: "安装",
      cancelText: "取消",
      variant: "danger",
      children: (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
          <p className="font-medium">提示</p>
          <p className="mt-1">
            从 URL 安装的{targetLabel}来自社区，请确认来源可信
          </p>
        </div>
      ),
    });
    if (!ok) return;

    try {
      const res = await apiFetch<any>("/api/manage/install", {
        method: "POST",
        body: JSON.stringify({ repoUrl, target, packageManager }),
      });
      const warning = res.missingServices?.length
        ? ` 缺失服务: ${res.missingServices.join(", ")}`
        : "";
      setMessage(`安装成功，请重启 Mioku.${warning}`);
      setRepoUrl("");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "安装失败");
    }
  };

  const checkUpdate = async (name: string) => {
    try {
      const res = await apiFetch<any>("/api/manage/check-update", {
        method: "POST",
        body: JSON.stringify({ name, target }),
      });
      setMessage(
        res.hasUpdates
          ? `${name} 有更新:\n${(res.changelog || []).join("\n")}`
          : `${name} 已是最新`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "检查更新失败");
    }
  };

  const update = async (name: string) => {
    try {
      await apiFetch<any>("/api/manage/update", {
        method: "POST",
        body: JSON.stringify({ name, target, packageManager }),
      });
      setMessage(`${name} 更新完成，请重启 Mioku`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "更新失败");
    }
  };

  const remove = async (name: string) => {
    const ok = await confirm({
      title: `卸载${target === "plugin" ? "插件" : "服务"}`,
      message: `确认卸载 ${name} 吗？`,
      confirmText: "卸载",
      cancelText: "取消",
    });
    if (!ok) return;

    try {
      await apiFetch<any>("/api/manage/remove", {
        method: "POST",
        body: JSON.stringify({ name, target }),
      });
      setMessage(`已删除 ${name}，请重启 Mioku`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "卸载失败");
    }
  };

  return (
    <div className="space-y-4 animate-soft-pop">
      <Card>
        <CardHeader>
          <CardTitle>{target === "plugin" ? "插件安装" : "服务安装"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="输入 Git 仓库地址"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Select value={packageManager} onValueChange={setPackageManager}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="选择包管理器" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bun">bun</SelectItem>
                <SelectItem value="pnpm">pnpm</SelectItem>
                <SelectItem value="npm">npm</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={install}>安装</Button>
          </div>
          {message ? (
            <pre className="whitespace-pre-wrap rounded-md border bg-secondary/40 p-2 text-xs">
              {message}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{target === "plugin" ? "插件列表" : "服务列表"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.name}
                className="border-l-2 border-border px-4 py-1"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.name}</p>
                  <Badge>{item.version}</Badge>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  {item.description || "无描述"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkUpdate(item.name)}
                  >
                    检查更新
                  </Button>
                  <Button size="sm" onClick={() => update(item.name)}>
                    更新
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(item.name)}
                  >
                    卸载
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无内容</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
