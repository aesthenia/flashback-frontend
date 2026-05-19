"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Protected, useAuth } from "../../components/auth";
import { CapsuleCard, OnlinePanel } from "../../components/capsules";
import { apiFetch, buildQuery } from "../../lib/api";

const DEFAULT_FILTERS = { q: "", tag: "", lockState: "", sort: "newest" };

export default function CapsulesPage() {
  const { lastWsMessage } = useAuth();
  const [capsules, setCapsules] = useState([]);
  const [tags, setTags] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);
  const filtersRef = useRef(DEFAULT_FILTERS);

  async function load(next) {
    filtersRef.current = next;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/capsules${buildQuery(next)}`);
      setCapsules(data.capsules || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = {
      q: params.get("q") || "",
      tag: params.get("tag") || "",
      lockState: params.get("lockState") || "",
      sort: params.get("sort") || "newest",
    };
    setFilters(initial);
    setSearchInput(initial.q);
    load(initial);
    apiFetch("/tags")
      .then((data) => setTags((data.tags || []).slice(0, 5)))
      .catch(() => setTags([]));
  }, []);

  function updateFilter(field, value) {
    const next = { ...filters, [field]: value };
    setFilters(next);
    load(next);
  }

  function onSearchChange(value) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = { ...filters, q: value };
      setFilters(next);
      load(next);
    }, 300);
  }

  useEffect(() => {
    if (!lastWsMessage) return;
    const { event, payload } = lastWsMessage;
    if (event === "CAPSULE_CREATED" || event === "CAPSULE_OPENED" || event === "CAPSULE_UPDATED") {
      load(filtersRef.current);
    }
    if (event === "CAPSULE_DELETED") {
      setCapsules((current) =>
        current.filter((c) => String(c._id || c.id) !== String(payload.capsuleId))
      );
    }
    if (event === "COMMENT_COUNT_UPDATED") {
      setCapsules((current) =>
        current.map((c) =>
          String(c._id || c.id) === payload.capsuleId
            ? { ...c, commentsCount: payload.commentsCount }
            : c
        )
      );
    }
  }, [lastWsMessage]);

  return (
    <Protected>
      <main className="page">
        <div className="pageHead">
          <h1>Explore</h1>
          <Link className="btn primary" href="/capsules/new">New capsule</Link>
        </div>

        <div className="split">
          <section>
            <div className="filterBar">
              <input
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search capsules…"
              />
              <select value={filters.tag} onChange={(e) => updateFilter("tag", e.target.value)}>
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag._id || tag.slug} value={tag.slug}>
                    #{tag.name}
                  </option>
                ))}
              </select>
              <select value={filters.lockState} onChange={(e) => updateFilter("lockState", e.target.value)}>
                <option value="">Any state</option>
                <option value="opened">Opened</option>
                <option value="locked">Locked</option>
              </select>
              <select value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)}>
                <option value="newest">Newest</option>
                <option value="opensSoon">Opens soon</option>
                <option value="discussed">Most discussed</option>
              </select>
            </div>

            {error ? <p className="error">{error}</p> : null}
            {loading ? <p className="muted">Loading…</p> : null}
            <div className="grid">
              {capsules.map((capsule) => (
                <CapsuleCard capsule={capsule} key={capsule._id || capsule.id} />
              ))}
            </div>
            {!loading && !capsules.length ? <p className="muted">No capsules match these filters.</p> : null}
          </section>
          <OnlinePanel />
        </div>
      </main>
    </Protected>
  );
}
