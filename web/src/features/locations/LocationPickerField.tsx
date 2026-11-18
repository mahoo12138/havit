import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { IconArrowBarToUp, IconMapPin, IconSearch, IconX } from '@tabler/icons-react';

import type { Location } from '../../api/client';
import { Field, FieldError, FieldLabel } from '../../components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { ScrollArea } from '../../components/ui/scroll-area';
import {
  Tree,
  TreeGroup,
  TreeGroupLabel,
  TreeItem,
  TreeItemChevron,
  TreeItemIcon,
  TreeItemLabel,
} from '../../components/ui/tree';
import { buildIndex, breadcrumbOf, type LocationIndex } from './useLocationsData';
import { getLocationTypeMeta } from './types';
import * as s from './LocationPickerField.css';

const EMPTY_TREE: Location[] = [];

function expandedFor(index: LocationIndex, selectedId: string | null) {
  const expanded = new Set(index.roots.map((root) => root.id));
  let current = selectedId ? index.parentMap.get(selectedId) : undefined;

  while (current) {
    expanded.add(current);
    current = index.parentMap.get(current);
  }

  return expanded;
}

interface LocationFilter {
  query: string;
  matched: Set<string>;
  visible: Set<string>;
}

function buildFilter(index: LocationIndex, search: string): LocationFilter | null {
  const query = search.trim().toLowerCase();
  if (!query) return null;

  const matched = new Set<string>();
  for (const node of index.byId.values()) {
    if (node.name.toLowerCase().includes(query)) matched.add(node.id);
  }

  const visible = new Set(matched);
  for (const id of matched) {
    let current = index.parentMap.get(id);
    while (current) {
      visible.add(current);
      current = index.parentMap.get(current);
    }
  }

  return { query, matched, visible };
}

function HighlightedLabel({ name, query }: { name: string; query: string }) {
  if (!query) return <>{name}</>;
  const at = name.toLowerCase().indexOf(query);
  if (at === -1) return <>{name}</>;
  return (
    <>
      {name.slice(0, at)}
      <mark className={s.matchMark}>{name.slice(at, at + query.length)}</mark>
      {name.slice(at + query.length)}
    </>
  );
}

function LocationPickerField({
  label,
  tree,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  id,
  error,
  includeVirtualLocations = true,
  allowRoot = false,
}: {
  label: string;
  tree?: Location[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  error?: string | null;
  includeVirtualLocations?: boolean;
  allowRoot?: boolean;
}) {
  const { t } = useTranslation();
  const inputId = id ?? label;
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedTree = useMemo(
    () => (includeVirtualLocations ? tree ?? EMPTY_TREE : (tree ?? EMPTY_TREE).filter((root) => root.type !== 'virtual')),
    [includeVirtualLocations, tree],
  );
  const index = useMemo(() => buildIndex(resolvedTree), [resolvedTree]);
  const selected = value ? index.byId.get(value) ?? null : null;
  const breadcrumb = selected ? breadcrumbOf(index, selected.id) : [];
  const fullPath = breadcrumb.map((node) => node.name).join(' / ');
  const pathText = fullPath || t('assets.locationPickerNoSelection');
  const selectedMeta = getLocationTypeMeta(selected?.type);
  const SelectedIcon = selected ? selectedMeta.icon : IconMapPin;
  const physicalRoots = index.roots.filter((root) => root.type !== 'virtual');
  const virtualRoots = includeVirtualLocations ? index.roots.filter((root) => root.type === 'virtual') : [];
  const showGroupLabels = physicalRoots.length > 0 && virtualRoots.length > 0;
  const [open, setOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => expandedFor(index, selected?.id ?? null));
  const [query, setQuery] = useState('');
  const filter = useMemo(() => buildFilter(index, query), [index, query]);

  useEffect(() => {
    setExpanded(expandedFor(index, selected?.id ?? null));
  }, [index, selected?.id]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    setQuery('');
    if (!next) setTooltipOpen(false);
  }

  function toggleExpand(nodeId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  }

  function handleSelect(nodeId: string) {
    onChange(nodeId);
    setOpen(false);
    setTooltipOpen(false);
  }

  // The trigger is a typeable search field. Pointer events are stopped so
  // Base UI's trigger toggle never fires — focus opens the panel and
  // re-clicking the input keeps it open for caret placement.
  function keepFocus(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>
        {label}
        {required ? ' *' : null}
      </FieldLabel>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <div
          className={s.control}
          data-disabled={disabled || undefined}
          data-invalid={!!error || undefined}
          data-open={open || undefined}
        >
          <PopoverTrigger nativeButton={false} render={<span className={s.trigger} />} disabled={disabled}>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              className={s.triggerInput}
              value={open ? query : (selected?.name ?? '')}
              placeholder={placeholder ?? ''}
              disabled={disabled}
              aria-invalid={!!error}
              aria-required={required}
              title={fullPath || placeholder}
              onChange={(event) => setQuery(event.currentTarget.value)}
              onFocus={() => {
                if (!open && !disabled) setOpen(true);
              }}
              onMouseDown={keepFocus}
              onClick={keepFocus}
            />
            {query ? (
              <button
                type="button"
                className={s.triggerClear}
                aria-label={t('assets.locationPickerClearSearch')}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  setQuery('');
                }}
              >
                <IconX size={13} />
              </button>
            ) : (
              <span
                className={s.triggerIcon}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  inputRef.current?.focus();
                }}
              >
                <IconSearch size={15} />
              </span>
            )}
          </PopoverTrigger>

          <Popover open={tooltipOpen} onOpenChange={setTooltipOpen}>
            <PopoverTrigger
              type="button"
              className={s.pathButton}
              disabled={disabled}
              aria-label={t('assets.locationPickerPath')}
              title={pathText}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <SelectedIcon size={16} />
            </PopoverTrigger>
            <PopoverContent className={s.pathTooltip} side="top" align="start" sideOffset={6}>
              {pathText}
            </PopoverContent>
          </Popover>
        </div>

        <PopoverContent className={s.panel} align="start" sideOffset={6}>
          {index.roots.length === 0 && !allowRoot ? (
            <div className={s.empty}>
              {includeVirtualLocations ? t('locations.noLocationsHint') : t('assets.locationPickerNoPhysicalLocations')}
            </div>
          ) : (
            <ScrollArea className={s.treeBody}>
              <div className={s.treeInner}>
                {allowRoot && (
                  <TreeItem depth={0} selected={!selected} onClick={() => handleSelect('')}>
                    <TreeItemIcon>
                      <IconArrowBarToUp size={15} />
                    </TreeItemIcon>
                    <TreeItemLabel>{t('locations.asRoot')}</TreeItemLabel>
                  </TreeItem>
                )}
                <Tree aria-label={t('locations.tree')} indent={14}>
                  {physicalRoots.length > 0 && (
                    <LocationTreeSection
                      label={showGroupLabels ? t('locations.physicalPositions') : null}
                      nodes={physicalRoots}
                      index={index}
                      expanded={expanded}
                      selectedId={selected?.id ?? null}
                      onSelect={handleSelect}
                      onToggle={toggleExpand}
                      filter={filter}
                    />
                  )}
                  {virtualRoots.length > 0 && (
                    <LocationTreeSection
                      label={showGroupLabels ? t('locations.virtualPositions') : null}
                      nodes={virtualRoots}
                      index={index}
                      expanded={expanded}
                      selectedId={selected?.id ?? null}
                      onSelect={handleSelect}
                      onToggle={toggleExpand}
                      filter={filter}
                    />
                  )}
                </Tree>
                {filter && filter.matched.size === 0 && (
                  <div className={s.noResults}>{t('assets.locationPickerNoMatch')}</div>
                )}
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

function LocationTreeSection({
  label,
  nodes,
  index,
  expanded,
  selectedId,
  onSelect,
  onToggle,
  filter,
}: {
  label: string | null;
  nodes: Location[];
  index: LocationIndex;
  expanded: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  filter: LocationFilter | null;
}) {
  const roots = filter ? nodes.filter((node) => filter.visible.has(node.id)) : nodes;
  if (roots.length === 0) return null;

  return (
    <TreeGroup>
      {label && <TreeGroupLabel>{label}</TreeGroupLabel>}
      {roots.map((node) => (
        <LocationTreeNode
          key={node.id}
          node={node}
          depth={0}
          index={index}
          expanded={expanded}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggle={onToggle}
          filter={filter}
        />
      ))}
    </TreeGroup>
  );
}

function LocationTreeNode({
  node,
  depth,
  index,
  expanded,
  selectedId,
  onSelect,
  onToggle,
  filter,
}: {
  node: Location;
  depth: number;
  index: LocationIndex;
  expanded: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  filter: LocationFilter | null;
}) {
  const meta = getLocationTypeMeta(node.type);
  const Icon = meta.icon;
  const children = index.childrenMap.get(node.id) ?? [];
  const visibleChildren = filter ? children.filter((child) => filter.visible.has(child.id)) : children;
  const isExpanded = filter ? visibleChildren.length > 0 : expanded.has(node.id);
  const renderedChildren = filter ? visibleChildren : isExpanded ? children : [];

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (children.length === 0) return;
    if (event.key === 'ArrowRight' && !isExpanded) {
      event.preventDefault();
      onToggle(node.id);
    }
    if (event.key === 'ArrowLeft' && isExpanded) {
      event.preventDefault();
      onToggle(node.id);
    }
  }

  return (
    <div>
      <TreeItem
        depth={depth}
        selected={selectedId === node.id}
        expanded={isExpanded}
        folder={children.length > 0}
        onClick={() => onSelect(node.id)}
        onKeyDown={handleKeyDown}
      >
        <TreeItemChevron
          expanded={isExpanded}
          empty={children.length === 0}
          onToggle={() => {
            if (children.length > 0) onToggle(node.id);
          }}
        />
        <TreeItemIcon>
          <Icon size={15} />
        </TreeItemIcon>
        <TreeItemLabel>
          <HighlightedLabel name={node.name} query={filter?.query ?? ''} />
        </TreeItemLabel>
      </TreeItem>
      {renderedChildren.map((child) => (
        <LocationTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          index={index}
          expanded={expanded}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggle={onToggle}
          filter={filter}
        />
      ))}
    </div>
  );
}

export { LocationPickerField };
