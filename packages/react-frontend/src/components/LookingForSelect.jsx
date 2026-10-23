import { useEffect, useId, useRef, useState } from "react";

const LOOKING_FOR_OPTIONS = [
  "Investors",
  "A co-founder",
  "Developers",
  "Designers",
  "Mentors",
  "Feedback",
  "Early users",
];

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 6.25 8 10.25 12 6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LookingForSelect({ id, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const options =
    value && !LOOKING_FOR_OPTIONS.includes(value)
      ? [value, ...LOOKING_FOR_OPTIONS]
      : LOOKING_FOR_OPTIONS;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function choose(option) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div className={`looking-for${open ? " open" : ""}`} ref={rootRef}>
      <button
        id={id}
        type="button"
        className="looking-for-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className={value ? undefined : "placeholder"}>
          {value || "Optional"}
        </span>
        <Chevron />
      </button>

      {open && (
        <ul className="looking-for-menu" id={listId} role="listbox">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => choose("")}
            >
              None
            </button>
          </li>
          {options.map((option) => {
            const selected = option === value;

            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? "selected" : undefined}
                  onClick={() => choose(option)}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default LookingForSelect;
