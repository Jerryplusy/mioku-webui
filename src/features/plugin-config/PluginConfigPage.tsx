import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useTopbar } from "@/components/layout/TopbarContext";

type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

export function PluginConfigPage() {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [configs, setConfigs] = useState<Record<string, JSONValue>>({});
  const [msg, setMsg] = useState("");
  const [navAnimSeed, setNavAnimSeed] = useState(0);
  const lastPluginNavSignatureRef = useRef("");
  const { setLeftContent } = useTopbar();

  useEffect(() => {
    apiFetch<any>("/api/manage/plugins")
      .then((res) => {
        setPlugins(res.data || []);
        if (res.data?.[0]?.name) {
          setSelected(res.data[0].name);
        }
      })
      .catch((e) => {
        setMsg(e instanceof Error ? e.message : "加载插件列表失败");
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    apiFetch<any>(`/api/plugin-config/${selected}`)
      .then((res) => {
        setConfigs(res.data || {});
      })
      .catch((e) => {
        setMsg(e instanceof Error ? e.message : "加载插件配置失败");
      });
  }, [selected]);

  const pluginNavSignature = plugins
    .map((plugin) => String(plugin.name || ""))
    .join("|");

  useEffect(() => {
    if (!pluginNavSignature) return;
    if (pluginNavSignature === lastPluginNavSignatureRef.current) return;
    lastPluginNavSignatureRef.current = pluginNavSignature;
    setNavAnimSeed((value) => value + 1);
  }, [pluginNavSignature, plugins]);

  useEffect(() => {
    const chipClass = (active: boolean) =>
      `topbar-chip rounded-full border px-3 py-1.5 text-xs ${
        active
          ? "scale-105 border-transparent bg-primary text-primary-foreground shadow-md"
          : "border-transparent bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:opacity-95"
      }`;

    setLeftContent(
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-xs text-muted-foreground">插件:</span>
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {plugins.map((plugin, index) => {
            return (
              <span
                key={`${plugin.name}-${navAnimSeed}`}
                className="topbar-nav-item-enter"
                style={{ animationDelay: `${(index + 1) * 45}ms` }}
              >
              <button
                type="button"
                onClick={() => setSelected(plugin.name)}
                className={chipClass(selected === plugin.name)}
              >
                {plugin.name}
              </button>
              </span>
            );
          })}
        </div>
      </div>,
    );

    return () => setLeftContent(null);
  }, [navAnimSeed, plugins, selected, setLeftContent]);

  const updateByPath = (fileName: string, path: string[], nextValue: JSONValue) => {
    setConfigs((prev) => {
      const source = structuredClone((prev[fileName] ?? {}) as JSONValue);
      if (path.length === 0) {
        return { ...prev, [fileName]: nextValue };
      }

      let cursor: any = source;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (cursor[key] == null) {
          cursor[key] = {};
        }
        cursor = cursor[key];
      }

      cursor[path[path.length - 1]] = nextValue;
      return { ...prev, [fileName]: source };
    });
  };

  const save = async (fileName: string) => {
    await apiFetch(`/api/plugin-config/${selected}/${fileName}`, {
      method: "PUT",
      body: JSON.stringify(configs[fileName]),
    });
    setMsg(`${selected}/${fileName}.json 已保存`);
  };

  return (
    <div className="space-y-4 animate-soft-pop">
      <Card>
        <CardHeader><CardTitle>插件配置管理（动态表单）</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(configs).map(([name, value]) => (
            <div key={name} className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-semibold">{name}.json</p>
              <ConfigFields fileName={name} value={value} path={[]} onChange={updateByPath} />
              <Button onClick={() => save(name)}>保存</Button>
            </div>
          ))}

          {msg ? <p className="text-sm text-primary">{msg}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigFields({
  fileName,
  value,
  path,
  onChange,
}: {
  fileName: string;
  value: JSONValue;
  path: string[];
  onChange: (fileName: string, path: string[], next: JSONValue) => void;
}) {
  if (typeof value === "string") {
    return <Input value={value} onChange={(e) => onChange(fileName, path, e.target.value)} />;
  }

  if (typeof value === "number") {
    return <Input type="number" value={String(value)} onChange={(e) => onChange(fileName, path, Number(e.target.value))} />;
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value} onChange={(e) => onChange(fileName, path, e.target.checked)} />
        {path[path.length - 1] || "boolean"}
      </label>
    );
  }

  if (value === null) {
    return <Input value="null" disabled />;
  }

  if (Array.isArray(value)) {
    return (
      <Textarea
        className="min-h-24 font-mono text-xs"
        value={JSON.stringify(value, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value) as JSONValue;
            onChange(fileName, path, parsed);
          } catch {
            // ignore invalid json while typing
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-2 rounded-md border bg-secondary/20 p-3">
      {Object.entries(value).map(([key, child]) => (
        <div key={key} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{[...path, key].join(".")}</p>
          <ConfigFields fileName={fileName} value={child as JSONValue} path={[...path, key]} onChange={onChange} />
        </div>
      ))}
    </div>
  );
}
