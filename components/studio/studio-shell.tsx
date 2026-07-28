"use client";

import { useState } from "react";
import type { StudioNode, StudioNodeKind, StudioView } from "@/lib/studio-types";
import { StudioCanvas } from "./canvas/studio-canvas";

const palette: Array<{ kind: StudioNodeKind; icon: string; label: string; help: string }> = [
  { kind: "idea", icon: "✦", label: "创意", help: "概念与方向" },
  { kind: "script", icon: "文", label: "剧本", help: "场景与动作" },
  { kind: "character", icon: "人", label: "角色", help: "身份与状态" },
  { kind: "scene", icon: "景", label: "场景", help: "空间与灯光" },
  { kind: "shot", icon: "镜", label: "镜头", help: "构图与控制" },
  { kind: "generation", icon: "生", label: "生成", help: "图片或视频" },
  { kind: "review", icon: "验", label: "验收", help: "质量与修复" },
  { kind: "timeline", icon: "剪", label: "时间线", help: "成片组织" },
];

export function StudioShell() {
  const [view, setView] = useState<StudioView>("all");
  const [selectedNode, setSelectedNode] = useState<StudioNode | null>(null);
  const [createRequest, setCreateRequest] = useState<{ kind: StudioNodeKind; nonce: number } | null>(null);

  const requestNode = (kind: StudioNodeKind) => {
    setCreateRequest({ kind, nonce: Date.now() });
  };

  return (
    <div className="studio-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div>
            <div className="brand-title">AI Native Film Studio</div>
            <div className="brand-subtitle">无限画布影视工作台 · 自主开发原型</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button">保存快照</button>
          <button className="primary-button" type="button">运行选中节点</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <p className="section-title">当前项目</p>
          <section className="project-card">
            <h2>《照骨》</h2>
            <p className="muted">90 秒 · 16:9 · 无对白悬疑</p>
            <div className="project-progress"><span /></div>
            <p className="muted">总体完成度 32%</p>
          </section>

          <p className="section-title" style={{ marginTop: 22 }}>添加节点</p>
          <div className="palette-list">
            {palette.map((item) => (
              <button className="palette-button" key={item.kind} onClick={() => requestNode(item.kind)} type="button">
                <span className="palette-icon">{item.icon}</span>
                <span className="palette-copy">
                  <strong>{item.label}</strong>
                  <small>{item.help}</small>
                </span>
                <span className="add-sign">＋</span>
              </button>
            ))}
          </div>
        </aside>

        <StudioCanvas
          view={view}
          onViewChange={setView}
          onNodeSelect={setSelectedNode}
          createRequest={createRequest}
        />

        <aside className="inspector">
          <p className="section-title">节点详情</p>
          {selectedNode ? (
            <section className="inspector-card">
              <div>
                <h2>{selectedNode.data.label}</h2>
                <p className="muted">{selectedNode.data.version ?? "未版本化"}</p>
              </div>
              <p className="muted">{selectedNode.data.summary}</p>
              <div className="inspector-grid">
                <div className="inspector-field">
                  <span>节点类型</span>
                  <span>{selectedNode.data.kind}</span>
                </div>
                <div className="inspector-field">
                  <span>当前状态</span>
                  <span>{selectedNode.data.status}</span>
                </div>
                {Object.entries(selectedNode.data.details ?? {}).map(([key, value]) => (
                  <div className="inspector-field" key={key}>
                    <span>{key}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <button className="primary-button" type="button">编辑节点内容</button>
            </section>
          ) : (
            <p className="inspector-empty">选择一个节点，查看它的输入、输出、版本、状态与连续性信息。</p>
          )}
        </aside>
      </div>
    </div>
  );
}
