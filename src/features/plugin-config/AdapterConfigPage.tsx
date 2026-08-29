import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useTopbar } from "@/components/layout/TopbarContext";
import { ConfigPageRenderer } from "./ConfigPageRenderer";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [k: string]: JSONValue };

interface ConfigPageData {
  plugin: string;
  title: string;
  description?: string;
  markdown: string;
  fields: any[];
  hasCustomPage: boolean;
  configs: Record<string, JSONValue>;
}

interface ConfigurableAdapter {
  name: string;
  title?: string;
  description?: string;
  hasPage?: boolean;
}

function isEmptyConfigValue(value: JSONValue): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function filterConfigFiles(
  input: Record<string, JSONValue>,
): Record<string, JSONValue> {
  return Object.fromEntries(
    Object.entries(input || {}).filter(([, value]) => !isEmptyConfigValue(value)),
  ) as Record<string, JSONValue>;
}

export function AdapterConfigPage() {
  const [adapters, setAdapters] = useState<ConfigurableAdapter[]>([]);
  const [selected, setSelected] = useState("");
  const [configs, setConfigs] = useState<Record<string, JSONValue>>({});
  const [pageData, setPageData] = useState<ConfigPageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [navAnimSeed, setNavAnimSeed] = useState(0);
  const lastAdapterNavSignatureRef = useRef("");
  const { setLeftContent, setRightContent } = useTopbar();

  const initialConfigsRef = useRef<string>("");
  const selectedRef = useRef("");
  const configsRef = useRef<Record<string, JSONValue>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useUnsavedChanges(hasChanges);

  selectedRef.current = selected;
  configsRef.current = configs;

  const loadConfigurableAdapters = async (preferredSelected?: string) => {
    try {
      const res = await apiFetch<any>("/api/adapter-config/overview");
      const items = (res.data || []) as ConfigurableAdapter[];

      const configurable = items.filter((item) => item.hasPage);
      setAdapters(configurable);

      if (configurable.length === 0) {
        setSelected("");
        setConfigs({});
        return;
      }

      const nextSelected =
        preferredSelected && configurable.some((item) => item.name === preferredSelected)
          ? preferredSelected
          : configurable[0].name;

      setSelected(nextSelected);
    } catch {
      toast.error("加载适配器配置失败");
    }
  };

  useEffect(() => {
    loadConfigurableAdapters().then();
  }, []);

  useEffect(() => {
    if (!selected) return;

    const loadConfigs = async () => {
      setLoading(true);
      try {
        const pageRes = await apiFetch<any>(
          `/api/adapter-config/${encodeURIComponent(selected)}/page`,
        ).catch(() => ({ data: null }));

        if (!pageRes.data) {
          setPageData(null);
          return;
        }

        const filteredConfigs = filterConfigFiles(pageRes.data.configs || {});
        setConfigs(filteredConfigs);
        initialConfigsRef.current = JSON.stringify(filteredConfigs);
        setPageData({
          ...pageRes.data,
          configs: filteredConfigs,
        });
      } catch (error) {
        toast.error("加载适配器配置失败");
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, [selected]);

  useEffect(() => {
    const current = JSON.stringify(configs);
    setHasChanges(current !== initialConfigsRef.current);
  }, [configs]);

  const adapterNavSignature = adapters.map((adapter) => adapter.name).join("|");

  useEffect(() => {
    if (!adapterNavSignature) return;
    if (adapterNavSignature === lastAdapterNavSignatureRef.current) return;
    lastAdapterNavSignatureRef.current = adapterNavSignature;
    setNavAnimSeed((value) => value + 1);
  }, [adapterNavSignature]);

  useEffect(() => {
    const chipClass = (active: boolean) =>
      `topbar-chip rounded-full border px-3 py-1.5 text-xs ${
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-md"
          : "border-transparent bg-secondary/50 text-secondary-foreground hover:bg-secondary"
      }`;

    setLeftContent(
      <div className="topbar-chip-scroll flex items-center gap-1 overflow-x-auto">
        {adapters.map((adapter, index) => (
          <span
            key={`${adapter.name}-${navAnimSeed}`}
            className="topbar-nav-item-enter"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <button
              onClick={() => setSelected(adapter.name)}
              className={chipClass(selected === adapter.name)}
            >
              {adapter.name}
            </button>
          </span>
        ))}
      </div>,
    );

    setRightContent(
      <Button onClick={saveAll} disabled={saving || !hasChanges} size="sm">
        <Save className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">保存配置</span>
      </Button>,
    );
    return () => {
      setLeftContent(null);
      setRightContent(null);
    };
  }, [adapters, selected, saving, hasChanges]);

  const handleConfigChange = useCallback((newConfigs: Record<string, JSONValue>) => {
    setConfigs(newConfigs);
  }, []);

  const saveAll = async () => {
    const currentSelected = selectedRef.current;
    const currentConfigs = configsRef.current;
    if (!currentSelected) return;
    setSaving(true);

    try {
      const value = currentConfigs[currentSelected] ?? {};
      await apiFetch(`/api/adapter-config/${encodeURIComponent(currentSelected)}`, {
        method: "PUT",
        body: JSON.stringify(value),
      });

      toast.success("配置已保存");
      initialConfigsRef.current = JSON.stringify(currentConfigs);
      setHasChanges(false);
      await loadConfigurableAdapters(currentSelected);
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-soft-pop">
      {loading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            加载中...
          </CardContent>
        </Card>
      ) : null}

      {!loading && adapters.length === 0 && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            暂无带 config.md 的适配器配置页面
          </CardContent>
        </Card>
      )}

      {!loading && pageData && (
        <Card>
          <CardHeader>
            <CardTitle>{pageData.title || selected}</CardTitle>
            {pageData.description ? (
              <p className="text-sm text-muted-foreground">
                {pageData.description}
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <ConfigPageRenderer
              pageData={pageData}
              configs={configs}
              onConfigChange={handleConfigChange}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
