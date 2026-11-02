const SIZES = {
  xs: "size-6 rounded-[7px] text-sm",
  sm: "size-8 rounded-[9px] text-[19px]",
};

/** Pastille « م » de Majalis (police arabe système : voir --font-mark). */
export function Logo({ size = "sm" }: { size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden
      className={`grid flex-none place-items-center bg-accent font-mark leading-none font-bold text-accent-ink ${SIZES[size]}`}
    >
      م
    </span>
  );
}
