import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <main className="">
      <ConnectButton showBalance={true} />
    </main>
  );
}
