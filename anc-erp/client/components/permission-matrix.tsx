"use client";

import { useMemo, useState, useTransition } from "react";

import type { Permission, Role } from "../../packages/contracts/src";
import { updateAdminRolePermissionsAction } from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

type PermissionMatrixProps = {
  roles: Role[];
  permissions: Permission[];
};

export function PermissionMatrix({ roles, permissions }: PermissionMatrixProps) {
  const [message, setMessage] = useState("권한 매트릭스");
  const [isPending, startTransition] = useTransition();
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const targetRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const permission of permissions) {
      map.set(permission.groupKey, [...(map.get(permission.groupKey) ?? []), permission]);
    }
    return [...map.entries()];
  }, [permissions]);

  if (!targetRole) {
    return null;
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PermissionMatrix</p>
          <h3 className="panel-title">권한 매트릭스</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "info"} label={message} />
      </div>
      <label className="field" style={{ marginBottom: 16 }}>
        <span className="field-label">대상 역할 선택</span>
        <select value={targetRole.id} onChange={(event) => setSelectedRoleId(event.target.value)}>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </label>
      <div className="stack-list">
        {grouped.map(([groupKey, items]) => (
          <article className="ops-item" key={groupKey}>
            <div>
              <strong>{groupKey}</strong>
              <span>{items.map((item) => item.name).join(", ")}</span>
            </div>
            <button
              className="inline-link button-reset"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await updateAdminRolePermissionsAction(targetRole.id, {
                      permissionKeys: items.map((item) => item.key),
                    });
                    setMessage(`PATCH /roles/${targetRole.id}/permissions`);
                  } catch {
                    setMessage("권한 저장 대기");
                  }
                })
              }
              type="button"
            >
              {targetRole.name}에 적용
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
