import { useMemo, useState } from "react";
import { Check, Images, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type StickerOption = {
  id: string;
  character: string;
  label: string;
  url: string;
};

type StickerPickerProps = {
  options: StickerOption[];
  characters: string[];
  stickers: string[];
  disabled?: boolean;
  onCharactersChange: (characters: string[]) => void;
  onStickersChange: (stickers: string[]) => void;
};

export function StickerPicker({
  options,
  characters,
  stickers,
  disabled = false,
  onCharactersChange,
  onStickersChange,
}: StickerPickerProps) {
  const [query, setQuery] = useState("");
  const allCharacters = useMemo(
    () => Array.from(new Set(options.map((item) => item.character))).sort(),
    [options],
  );
  const enabledCharacters = useMemo(
    () => new Set(characters.length > 0 ? characters : allCharacters),
    [allCharacters, characters],
  );
  const selectedStickers = useMemo(() => {
    const available = new Set(options.map((item) => item.id));
    return new Set(
      stickers.length > 0
        ? stickers.filter((item) => available.has(item))
        : available,
    );
  }, [options, stickers]);
  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return options.filter((item) => {
      if (!enabledCharacters.has(item.character)) return false;
      if (!normalizedQuery) return true;
      return `${item.character} ${item.label}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [enabledCharacters, options, query]);

  const selectedVisibleCount = visibleOptions.filter((item) =>
    selectedStickers.has(item.id),
  ).length;

  const toggleCharacter = (character: string) => {
    const next = new Set(enabledCharacters);
    if (next.has(character)) {
      if (next.size === 1) return;
      next.delete(character);
    } else {
      next.add(character);
    }
    const ordered = allCharacters.filter((item) => next.has(item));
    onCharactersChange(ordered.length === allCharacters.length ? [] : ordered);
  };

  const toggleSticker = (id: string) => {
    const next = new Set(selectedStickers);
    if (next.has(id)) {
      if (next.size === 1) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    const ordered = options
      .map((item) => item.id)
      .filter((item) => next.has(item));
    onStickersChange(ordered.length === options.length ? [] : ordered);
  };

  if (options.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center border-y py-10 text-center">
        <Images className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">目录中还没有表情包</p>
        <p className="mt-1 text-xs text-muted-foreground">
          data/chat/meme 下的角色目录会显示在这里
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-5", disabled && "pointer-events-none opacity-55")}
    >
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">角色范围</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {characters.length === 0
                ? "全部角色"
                : `${characters.length} 个角色`}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={characters.length === 0}
            onClick={() => onCharactersChange([])}
          >
            全部角色
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCharacters.map((character) => {
            const selected = enabledCharacters.has(character);
            const count = options.filter(
              (item) => item.character === character,
            ).length;
            return (
              <label
                key={character}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors duration-150",
                  selected
                    ? "border-primary/50 bg-secondary text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <input
                  className="form-checkbox"
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleCharacter(character)}
                />
                <span className="font-medium">{character}</span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 border-t pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">可发送表情</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              当前范围已选 {selectedVisibleCount} / {visibleOptions.length}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="搜索角色或标签"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onStickersChange([])}
              disabled={stickers.length === 0}
            >
              全部使用
            </Button>
          </div>
        </div>

        {visibleOptions.length === 0 ? (
          <div className="border-y py-10 text-center text-sm text-muted-foreground">
            没有匹配的表情包
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleOptions.map((item) => {
              const selected = selectedStickers.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  className={cn(
                    "group overflow-hidden rounded-md border bg-card text-left transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.98]",
                    selected
                      ? "border-primary/60 shadow-sm"
                      : "border-border hover:border-primary/35",
                  )}
                  onClick={() => toggleSticker(item.id)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={item.url}
                      alt={item.label}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                    <span
                      className={cn(
                        "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border shadow-sm",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card/90 text-transparent",
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="min-w-0 border-t px-3 py-2.5">
                    <p
                      className="truncate text-xs font-medium"
                      title={item.label}
                    >
                      {item.label}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {item.character}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
