type Props = { class?: string };

export default function TypeIcon(props: Props) {
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
      <path d="M3 20 8.5 5 14 20" />
      <path d="M5 15h7" />
      <path d="m14.5 20 3-8 3 8" />
      <path d="M15.7 17.5h4.6" />
    </svg>
  );
}
