import MobileMyPageBackLink from "./mob";

type MyPageBackLinkProps = {
  href?: string;
  label?: string;
};

export default function MyPageBackLink(props: MyPageBackLinkProps) {
  return <MobileMyPageBackLink {...props} />;
}
