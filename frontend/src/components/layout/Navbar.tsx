import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);

    if (location.pathname !== "/") {
      window.location.href = `/#${id}`;
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const navItems = [
    { label: "Home", id: "home" },
    { label: "Solutions", id: "solutions" },
    { label: "Impact", id: "impact" },
    { label: "About", id: "about" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <>
      <header
        className={`
          fixed inset-x-0 top-0 z-[100]
          transition-all duration-500
          ${
            scrolled
              ? "bg-[#071b2b]/92 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
              : "bg-gradient-to-b from-[#061a2a]/90 via-[#061a2a]/55 to-transparent"
          }
        `}
      >
        <div
          className={`
            mx-auto flex h-[76px] max-w-[1440px]
            items-center justify-between
            px-5 sm:px-8 lg:px-12
            transition-all duration-500
            ${scrolled ? "h-[68px]" : "h-[82px]"}
          `}
        >
          {/* LOGO */}
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-3"
          >
            <div
              className="
                relative flex h-10 w-10 items-center justify-center
                overflow-hidden rounded-xl
                bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-600
                shadow-[0_0_25px_rgba(37,149,255,0.35)]
                transition duration-300
                group-hover:scale-105
              "
            >
              <div className="absolute inset-0 bg-white/10" />

              <svg
                viewBox="0 0 40 40"
                className="relative h-7 w-7 text-white"
                fill="none"
              >
                <path
                  d="M7 27c4-2 6-6 8-11 2-5 5-8 9-8 3 0 6 2 9 5"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M8 31c5-1 9-3 12-7 3-4 6-7 12-7"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity=".72"
                />
              </svg>
            </div>

            <div className="leading-none">
              <div className="text-[19px] font-extrabold tracking-[-0.04em] text-white">
                Relief<span className="text-cyan-300">Nexus</span>
              </div>

              <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Disaster Management Platform
              </div>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="
                  group relative rounded-full
                  px-4 py-2.5
                  text-[13px] font-semibold
                  text-white/75
                  transition-all duration-300
                  hover:bg-white/8
                  hover:text-white
                "
              >
                {item.label}

                <span
                  className="
                    absolute bottom-1.5 left-1/2 h-[2px] w-0
                    -translate-x-1/2 rounded-full
                    bg-gradient-to-r from-cyan-300 to-blue-400
                    transition-all duration-300
                    group-hover:w-5
                  "
                />

                {index === 0 && (
                  <span className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-cyan-300 opacity-0 transition group-hover:opacity-100" />
                )}
              </button>
            ))}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="hidden items-center gap-3 lg:flex">
            {/* LANGUAGE */}
            <button
              type="button"
              className="
                flex items-center gap-2 rounded-full
                border border-white/15
                bg-white/7
                px-3.5 py-2
                text-[12px] font-semibold text-white/85
                backdrop-blur-md
                transition hover:border-white/30 hover:bg-white/12
              "
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3c2.3 2.4 3.4 5.4 3.4 9s-1.1 6.6-3.4 9c-2.3-2.4-3.4-5.4-3.4-9S9.7 5.4 12 3Z" />
              </svg>

              EN

              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m7 10 5 5 5-5" />
              </svg>
            </button>

            {/* SIGN IN */}
            <Link
              to="/login"
              className="
                rounded-full
                border border-white/35
                bg-white/5
                px-5 py-2.5
                text-[13px] font-bold text-white
                backdrop-blur-md
                transition-all duration-300
                hover:border-white/70
                hover:bg-white/12
                hover:-translate-y-0.5
              "
            >
              Sign In
            </Link>

            {/* GET STARTED */}
            <Link
              to="/register"
              className="
                group relative overflow-hidden
                rounded-full
                bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500
                px-6 py-3
                text-[13px] font-extrabold text-white
                shadow-[0_8px_30px_rgba(37,99,235,0.35)]
                transition-all duration-300
                hover:-translate-y-0.5
                hover:shadow-[0_12px_35px_rgba(37,149,255,0.48)]
              "
            >
              <span
                className="
                  absolute inset-0
                  -translate-x-full
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  transition-transform duration-700
                  group-hover:translate-x-full
                "
              />

              <span className="relative flex items-center gap-2">
                Get Started

                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h13" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </span>
            </Link>
          </div>

          {/* MOBILE BUTTON */}
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="
              flex h-11 w-11 items-center justify-center
              rounded-xl border border-white/15
              bg-white/10 text-white
              backdrop-blur-md
              lg:hidden
            "
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        <div
          className={`
            overflow-hidden border-t border-white/10
            bg-[#061a2a]/96 backdrop-blur-2xl
            transition-all duration-500 lg:hidden
            ${
              mobileOpen
                ? "max-h-[500px] opacity-100"
                : "max-h-0 opacity-0"
            }
          `}
        >
          <div className="mx-auto max-w-[1440px] px-5 py-5">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="
                    rounded-xl px-4 py-3
                    text-left text-sm font-semibold
                    text-white/75
                    transition hover:bg-white/10 hover:text-white
                  "
                >
                  {item.label}
                </button>
              ))}

              <div className="my-3 h-px bg-white/10" />

              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="
                  rounded-xl px-4 py-3
                  text-sm font-semibold text-white
                  transition hover:bg-white/10
                "
              >
                Sign In
              </Link>

              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="
                  mt-1 rounded-xl
                  bg-gradient-to-r from-blue-500 to-cyan-500
                  px-4 py-3
                  text-center text-sm font-extrabold text-white
                "
              >
                Get Started 
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* TOP SPACER FOR NON-HERO PAGES */}
      {location.pathname !== "/" && (
        <div className="h-[76px] bg-[#071b2b]" />
      )}
    </>
  );
};

export default Navbar;