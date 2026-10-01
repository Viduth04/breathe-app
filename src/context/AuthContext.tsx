import { auth, db } from "@/firebase/config";
import { UserProfile } from "@/services/authService";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

type AuthState = {
  user: User | null; // Firebase login account
  profile: UserProfile | null; // Our Firestore profile (role, anonId, settings)
  loading: boolean; // True until we know whether someone is logged in
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopProfile: (() => void) | undefined;

    const stopAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      stopProfile?.();

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Live listener: when Privacy settings change, every screen updates instantly
      stopProfile = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snap) => {
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
          setLoading(false);
        },
        () => setLoading(false),
      );
    });

    return () => {
      stopAuth();
      stopProfile?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Use in any screen: const { user, profile } = useAuth();
export const useAuth = () => useContext(AuthContext);
