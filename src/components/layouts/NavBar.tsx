import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAccount } from "wagmi";
import { shortenAddress } from "@/utils/formatter";
import Button from "../ui/Button";
import ModalNavbar from "@/components/ui/Modal";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ModalConnectWallet from "../navbar/ModalConnectWallet";
import MessageBox from "../ui/MessageBox";

interface NavbarProps {
  static?: boolean;
  className?: string;
}

const Navbar = ({ static: isStatic = false, className = "" }: NavbarProps) => {
  const account = useAccount();

  const [openModalConnectWallet, setOpenModalConnectWallet] = useState(false);
  const [openModalNavbar, setOpenModalNavbar] = useState(false);

  return (
    <>
      <header
        className={`px-4 py-2.5 text-white ${
          isStatic
            ? `relative bg-main-bg ${className}`
            : `fixed top-0 left-0 right-0 z-50 opacity-100 bg-main-bg ${className}`
        }`}
      >
        <nav className="flex justify-between lg:justify-normal">
          <div className="mr-9 flex items-center gap-2">
            <img src="/img/dexgood-logo.png" alt="Logo" className="h-8" />
            <span
              className="text-xs font-semibold tracking-wide ml-1"
              style={{ color: "#ef4444" }}
            >
              testnet
            </span>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setOpenModalNavbar(true)}
          >
            <MenuIcon style={{ fontSize: "2rem" }} />
          </button>

          {/* Tablet & Desktop */}
          <ul className="hidden lg:flex grow items-center gap-2 font-medium">
            {/* <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "navbar-link-active" : "navbar-link"
                }
              >
                Home
              </NavLink>
            </li> */}
          </ul>

          {/* Tablet & Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Network/Chain Indicator */}
            {account.isConnected && account.chain && (
              <MessageBox>
                <div className="w-2 h-2 mr-2 rounded-full bg-success-bg"></div>
                <div className="text-sm">
                  <span>{account.chain.name}</span>
                  <span className="text-gray-500 ml-2">
                    #{account.chain.id}
                  </span>
                </div>
              </MessageBox>
            )}

            {/* Wallet Button */}
            <Button onClick={() => setOpenModalConnectWallet(true)}>
              {account.isConnected
                ? account.address
                  ? `${shortenAddress(account.address)}`
                  : "Account"
                : "Connect Wallet"}
            </Button>
          </div>
        </nav>
      </header>

      <ModalConnectWallet
        open={openModalConnectWallet}
        onClose={() => setOpenModalConnectWallet(false)}
      />

      <ModalNavbar
        open={openModalNavbar}
        onClose={() => setOpenModalNavbar(false)}
        maxWidth="full"
      >
        <ul className="flex flex-col grow gap-4 mt-2 font-medium">
          {/* Network/Chain Indicator */}
          {account.isConnected && account.chain && (
            <li>
              <MessageBox>
                <div className="w-2 h-2 mr-2 rounded-full bg-success-bg"></div>
                <div className="text-sm">
                  <span>{account.chain.name}</span>
                  <span className="text-gray-500 ml-2">
                    #{account.chain.id}
                  </span>
                </div>
              </MessageBox>
            </li>
          )}

          <li>
            <NavLink
              to="/"
              onClick={() => setOpenModalNavbar(false)}
              className="flex items-center gap-2 text-base"
            >
              <HomeIcon />
              <span>Home</span>
            </NavLink>
          </li>
          <li>
            <Button
              onClick={() => {
                setOpenModalNavbar(false);
                setOpenModalConnectWallet(true);
              }}
            >
              {account.isConnected
                ? account.address
                  ? `${shortenAddress(account.address)}`
                  : "Account"
                : "Connect Wallet"}
            </Button>
          </li>
        </ul>
      </ModalNavbar>
    </>
  );
};

export default Navbar;
