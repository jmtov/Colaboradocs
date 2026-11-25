type Props = { class?: string };

export default function Heading1Icon(props: Props) {
  return (
    <svg
      class={props.class}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="m17 12 3-2v8" />
    </svg>
  );
}
