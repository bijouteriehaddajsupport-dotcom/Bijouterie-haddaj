import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-bordeaux-900 px-6 text-center">
      <Image src="/logo-light.png" alt="Haddaj Bijouterie" width={469} height={439} className="h-auto w-[130px]" />
      <p className="mt-10 font-serif text-[90px] font-light leading-none text-or-400">404</p>
      <h1 className="mt-4 font-serif text-3xl text-ivoire">Cette page s&apos;est égarée</h1>
      <p className="mt-3 max-w-sm text-[15px] text-or-100/80">La création ou la page que vous cherchez n&apos;existe pas ou n&apos;est plus disponible.</p>
      <Link href="/" className="btn-gold mt-10">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
