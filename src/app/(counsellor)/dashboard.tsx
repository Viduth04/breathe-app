import LogoutButton from "@/components/auth/LogoutButton";
import Placeholder from "@/components/navigation/Placeholder";

export default function Dashboard() {
  return (
    <Placeholder
      title="Dashboard"
      owner="Muaath"
      requirements={["FR08"]}
    >
      <LogoutButton />
    </Placeholder>
  );
}
