import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

export type AIProtocol =
  | "openai-chat"
  | "openai-response"
  | "anthropic"
  | "gemini";

export type AIModelRole = "main" | "working" | "vision";

export type AIProvider = {
  id: string;
  name: string;
  protocol: AIProtocol;
  apiUrl: string;
  apiKey?: string;
  hasApiKey?: boolean;
  enabled: boolean;
};

export type AIModel = {
  id: string;
  providerId: string;
  modelId: string;
  name: string;
  capabilities: string[];
  isCustom?: boolean;
};

export type RoleBindings = Record<AIModelRole, string | undefined>;

const PROTOCOL_OPTIONS: Array<{
  value: AIProtocol;
  label: string;
  defaultUrl: string;
}> = [
  {
    value: "openai-chat",
    label: "OpenAI Chat",
    defaultUrl: "https://api.openai.com/v1",
  },
  {
    value: "openai-response",
    label: "OpenAI Response",
    defaultUrl: "https://api.openai.com/v1",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    defaultUrl: "https://api.anthropic.com",
  },
  {
    value: "gemini",
    label: "Gemini",
    defaultUrl: "https://generativelanguage.googleapis.com",
  },
];

const ROLE_META: Array<{
  role: AIModelRole;
  title: string;
  hint: string;
}> = [
  { role: "main", title: "主模型", hint: "正式回复，智商优先" },
  { role: "working", title: "工作模型", hint: "planner 等轻量任务，速度优先" },
  { role: "vision", title: "视觉模型", hint: "图片/视频描述，成本优先" },
];

type ProviderForm = {
  id?: string;
  name: string;
  protocol: AIProtocol;
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
};

const emptyForm = (): ProviderForm => ({
  name: "",
  protocol: "openai-chat",
  apiUrl: "https://api.openai.com/v1",
  apiKey: "",
  enabled: true,
});

type Props = {
  temperature: number;
  maxIterations: number;
  maxContextTokens: number;
  onBaseChange: (patch: {
    temperature?: number;
    maxIterations?: number;
    maxContextTokens?: number;
  }) => void;
};

export function ProvidersModelsTab({
  temperature,
  maxIterations,
  maxContextTokens,
  onBaseChange,
}: Props) {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [roles, setRoles] = useState<RoleBindings>({
    main: undefined,
    working: undefined,
    vision: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProviderForm>(emptyForm());
  const [customModel, setCustomModel] = useState({
    providerId: "",
    modelId: "",
    name: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [providersRes, modelsRes, rolesRes] = await Promise.all([
        apiFetch<{ data: AIProvider[] }>("/api/ai/providers"),
        apiFetch<{ data: AIModel[] }>("/api/ai/models"),
        apiFetch<{ data: RoleBindings }>("/api/ai/roles"),
      ]);
      setProviders(providersRes.data || []);
      setModels(modelsRes.data || []);
      setRoles({
        main: rolesRes.data?.main,
        working: rolesRes.data?.working,
        vision: rolesRes.data?.vision,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const modelsByProvider = useMemo(() => {
    const map = new Map<string, AIModel[]>();
    for (const model of models) {
      const list = map.get(model.providerId) || [];
      list.push(model);
      map.set(model.providerId, list);
    }
    return map;
  }, [models]);

  const openCreate = () => {
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (provider: AIProvider) => {
    setForm({
      id: provider.id,
      name: provider.name,
      protocol: provider.protocol,
      apiUrl: provider.apiUrl,
      apiKey: "",
      enabled: provider.enabled,
    });
    setFormOpen(true);
  };

  const saveProvider = async () => {
    setSaving(true);
    try {
      if (form.id) {
        await apiFetch(`/api/ai/providers/${form.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            protocol: form.protocol,
            apiUrl: form.apiUrl,
            enabled: form.enabled,
            ...(form.apiKey ? { apiKey: form.apiKey } : {}),
          }),
        });
        toast.success("提供商已更新");
      } else {
        await apiFetch("/api/ai/providers", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("提供商已创建");
      }
      setFormOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const removeProvider = async (id: string) => {
    if (!window.confirm("确定删除该提供商？相关模型与角色绑定也会清理。")) return;
    await apiFetch(`/api/ai/providers/${id}`, { method: "DELETE" });
    toast.success("提供商已删除");
    await load();
  };

  const testProvider = async (id: string) => {
    setTestingId(id);
    try {
      const res = await apiFetch<{
        data: { ok: boolean; error?: string; models?: AIModel[] };
      }>(`/api/ai/providers/${id}/test`, { method: "POST" });
      if (res.data?.ok) {
        toast.success(
          `连通成功${res.data.models?.length ? `，模型 ${res.data.models.length} 个` : ""}`,
        );
        await load();
      } else {
        toast.error(res.data?.error || "连通失败");
      }
    } finally {
      setTestingId(null);
    }
  };

  const refreshModels = async (id: string) => {
    await apiFetch(`/api/ai/providers/${id}/models/refresh`, {
      method: "POST",
    });
    toast.success("模型列表已刷新");
    await load();
  };

  const saveRoles = async (next: RoleBindings) => {
    setRoles(next);
    await apiFetch("/api/ai/roles", {
      method: "PUT",
      body: JSON.stringify(next),
    });
    toast.success("角色绑定已保存");
  };

  const addCustomModel = async () => {
    if (!customModel.providerId || !customModel.modelId) {
      toast.error("请填写提供商和模型 ID");
      return;
    }
    await apiFetch("/api/ai/models", {
      method: "POST",
      body: JSON.stringify(customModel),
    });
    toast.success("自定义模型已添加");
    setCustomModel({ providerId: "", modelId: "", name: "" });
    await load();
  };

  const removeCustomModel = async (id: string) => {
    await apiFetch(`/api/ai/models/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    toast.success("自定义模型已删除");
    await load();
  };

  if (loading) {
    return (
      <div className="border-y py-10 text-center text-sm text-muted-foreground">
        正在加载提供商与模型...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>AI 提供商</CardTitle>
            <CardDescription>
              在 AI 服务中配置协议、密钥；chat 只消费角色绑定的模型
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            新增
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              还没有提供商。先新增一个 OpenAI / Anthropic / Gemini 配置。
            </p>
          ) : null}
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{provider.name}</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                    {PROTOCOL_OPTIONS.find((p) => p.value === provider.protocol)
                      ?.label || provider.protocol}
                  </span>
                  {provider.enabled ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      启用
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <XCircle className="h-3.5 w-3.5" />
                      停用
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{provider.apiUrl}</p>
                <p className="text-xs text-muted-foreground">
                  模型 {(modelsByProvider.get(provider.id) || []).length} 个 ·{" "}
                  {provider.hasApiKey ? "已配置 Key" : "未配置 Key"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testProvider(provider.id)}
                  disabled={testingId === provider.id}
                >
                  {testingId === provider.id ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : null}
                  测试
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refreshModels(provider.id)}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  拉模型
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(provider)}
                >
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeProvider(provider.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {formOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? "编辑提供商" : "新增提供商"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">名称</p>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="OpenAI 主号"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">协议</p>
              <Select
                value={form.protocol}
                onValueChange={(value: AIProtocol) => {
                  const option = PROTOCOL_OPTIONS.find((p) => p.value === value);
                  setForm((p) => ({
                    ...p,
                    protocol: value,
                    apiUrl: option?.defaultUrl || p.apiUrl,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROTOCOL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">API URL</p>
              <Input
                value={form.apiUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, apiUrl: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                API Key{form.id ? "（留空表示不修改）" : ""}
              </p>
              <Input
                type="password"
                value={form.apiKey}
                onChange={(e) =>
                  setForm((p) => ({ ...p, apiKey: e.target.value }))
                }
                placeholder="sk-..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, enabled: checked }))
                }
              />
              <span className="text-sm">启用</span>
            </div>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                取消
              </Button>
              <Button onClick={saveProvider} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>角色绑定</CardTitle>
          <CardDescription>
            chat 插件按角色取实例：主模型 / 工作模型 / 视觉模型
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {ROLE_META.map((item) => (
            <div key={item.role} className="space-y-2">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
              <Select
                value={roles[item.role] || "__none__"}
                onValueChange={(value) => {
                  const next = {
                    ...roles,
                    [item.role]: value === "__none__" ? undefined : value,
                  };
                  void saveRoles(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未绑定</SelectItem>
                  {providers.map((provider) =>
                    (modelsByProvider.get(provider.id) || []).map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {provider.name} / {model.name || model.modelId}
                      </SelectItem>
                    )),
                  )}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>模型列表</CardTitle>
          <CardDescription>拉取或手动添加模型，供角色绑定使用</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <Select
              value={customModel.providerId || "__none__"}
              onValueChange={(value) =>
                setCustomModel((p) => ({
                  ...p,
                  providerId: value === "__none__" ? "" : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="提供商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">选择提供商</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="模型 ID"
              value={customModel.modelId}
              onChange={(e) =>
                setCustomModel((p) => ({ ...p, modelId: e.target.value }))
              }
            />
            <Input
              placeholder="显示名（可选）"
              value={customModel.name}
              onChange={(e) =>
                setCustomModel((p) => ({ ...p, name: e.target.value }))
              }
            />
            <Button onClick={addCustomModel}>添加自定义模型</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">提供商</th>
                  <th className="py-2 pr-3 font-medium">模型</th>
                  <th className="py-2 pr-3 font-medium">能力</th>
                  <th className="py-2 pr-3 font-medium">来源</th>
                  <th className="py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => {
                  const provider = providers.find(
                    (item) => item.id === model.providerId,
                  );
                  return (
                    <tr key={model.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{provider?.name || model.providerId}</td>
                      <td className="py-2 pr-3">
                        <div className="font-medium">
                          {model.name || model.modelId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {model.modelId}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {(model.capabilities || []).map((cap) => (
                            <span
                              key={cap}
                              className="rounded bg-secondary px-1.5 py-0.5 text-xs"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        {model.isCustom ? "自定义" : "拉取"}
                      </td>
                      <td className="py-2">
                        {model.isCustom ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeCustomModel(model.id)}
                          >
                            删除
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {models.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                暂无模型。可对提供商点「拉模型」或手动添加。
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>生成参数</CardTitle>
          <CardDescription>仍保存在 chat/base（与提供商无关）</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">温度</p>
            <Input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) =>
                onBaseChange({ temperature: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">最大迭代次数</p>
            <Input
              type="number"
              value={maxIterations}
              onChange={(e) =>
                onBaseChange({ maxIterations: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">上下文 token 上限(k)</p>
            <Input
              type="number"
              value={maxContextTokens}
              onChange={(e) =>
                onBaseChange({ maxContextTokens: Number(e.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
