import Header from '@/components/Header'
import Image from 'next/image'

const RATING_SCALE = [
  { score: 10, text: 'Outstanding. Always want to play and expect this will never change.' },
  { score: 9,  text: "Excellent game. Always want to play it." },
  { score: 8,  text: "Very good game. I like to play. Probably I'll suggest it and will never turn down a game." },
  { score: 7,  text: 'Good game, usually willing to play.' },
  { score: 6,  text: 'Ok game, some fun or challenge at least, will play sporadically if in the right mood.' },
  { score: 5,  text: 'Average game, slightly boring, take it or leave it.' },
  { score: 4,  text: "Not so good, it doesn't get me but could be talked into it on occasion." },
  { score: 3,  text: "Likely won't play this again although could be convinced. Bad." },
  { score: 2,  text: "Extremely annoying game, won't play this ever again." },
  { score: 1,  text: "Defies description of a game. You won't catch me dead playing this. Clearly broken." },
]

function scoreColor(score: number): string {
  if (score >= 9) return '#C9A961'
  if (score >= 7) return '#b8924a'
  if (score >= 5) return '#a07838'
  if (score >= 3) return '#c06030'
  return '#b84030'
}

interface FAQItemProps {
  question: string
  children: React.ReactNode
  image?: React.ReactNode
}

function FAQItem({ question, children, image }: FAQItemProps) {
  return (
    <div className="sidebar-panel" style={{ padding: '1.5rem 1.75rem' }}>
      <div className="sidebar-panel-tint" />
      <div className="sidebar-panel-content">
        <h2
          className="text-lg font-bold mb-3"
          style={{ color: '#C9A961', textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
        >
          {question}
        </h2>
        {image && <div className="mb-4">{image}</div>}
        <div style={{ color: '#E8D4B8', fontSize: '0.9375rem', lineHeight: 1.7 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="flex-1 p-4 sm:p-8 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold">FAQ</h1>
          {/* <p className="mt-1" style={{ color: 'rgba(232,212,184,0.6)', fontSize: '0.9375rem' }}>
            Frequently asked questions about Meep Meet Game Club
          </p> */}
        </div>

        <div className="flex flex-col gap-6">

          {/* Q1 */}
          <FAQItem question="Cool website, what can I do in here?">
            <p>
              Welcome to the Meep Meet Game Club website! Here&apos;s what you can do:
            </p>
            <ul className="mt-3 flex flex-col gap-1.5" style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
              <li><span style={{ color: '#C9A961', fontWeight: 600 }}>RSVP to events</span> — via the Events tab</li>
              <li><span style={{ color: '#C9A961', fontWeight: 600 }}>Check rosters and games</span> — in &ldquo;Event Details&rdquo; of the Events tab</li>
              <li><span style={{ color: '#C9A961', fontWeight: 600 }}>Browse the game library</span> — in the Games tab</li>
              <li><span style={{ color: '#C9A961', fontWeight: 600 }}>Request games to play</span> — via the &ldquo;Interested&rdquo; button in the Games tab</li>
              <li><span style={{ color: '#C9A961', fontWeight: 600 }}>Rate games you&apos;ve played</span> — from your player profile in the Meeps tab</li>
              <li><span style={{ color: '#C9A961', fontWeight: 600 }}>Track your performance</span> — see your MMR and Wins in the Meeps tab</li>
            </ul>
          </FAQItem>

          {/* Q2 */}
          <FAQItem question="I have a friend I want to invite, can I invite them?">
            <p>
              We would love to have your friends attend! However, as a private club with limited space (for now),
              please run it by us first to make sure we have room for any given event.
            </p>
          </FAQItem>

          {/* Q3 */}
          <FAQItem question="What is the Meep Meet Rating (MMR) system and how does it work?">
            <p>
              The Meep Meet Rating (MMR) system tracks game performance at a deeper level than just wins and losses.
              Points are awarded for 1st, 2nd, and 3rd place and normalized over the number of games played.
            </p>
            <p className="mt-3">
              A modifier also adjusts points for player count, cooperative games, and team games — so winning
              against 6 players awards more points than winning against smaller player counts, coop games, or
              team games.
            </p>
            <p className="mt-3" style={{ color: 'rgba(232,212,184,0.65)', fontStyle: 'italic' }}>
              Four ranked games must be played before an MMR will appear on a player&apos;s profile.
            </p>
          </FAQItem>

          {/* Q4 — Rating guidelines with scale */}
          <FAQItem question="What are the game rating guidelines?">
            <p>
              Rating games helps us better place Meeps at tables they&apos;ll enjoy. After you play a game, it
              will appear on your player profile awaiting your rating. Ratings are linked to game mechanisms —
              as you play more, your profile becomes more tailored to what you do and don&apos;t like.
            </p>
            <p className="mt-3">
              The rating system follows BoardGameGeek&apos;s 1–10 scale. You can rate to one decimal place
              (e.g. 7.4).
            </p>

            {/* Rating scale */}
            <div
              className="mt-4 flex flex-col gap-2 rounded-lg p-4"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,169,97,0.2)' }}
            >
              {RATING_SCALE.map(({ score, text }) => (
                <div key={score} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '1.0625rem',
                      color: scoreColor(score),
                      flexShrink: 0,
                      width: '1.5rem',
                      textAlign: 'right',
                    }}
                  >
                    {score}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: '#D4C4A8', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </FAQItem>

          {/* Q5 */}
          <FAQItem question="I'd like to try certain games, how can I request them?">
            <p>
              Browse our collective game library in the Games tab and click the{' '}
              <span style={{ color: '#C9A961', fontWeight: 600 }}>&ldquo;Interested&rdquo;</span> button on any
              game you&apos;d like to play. This will add it to your player profile as a game request. We will
              make every attempt to satisfy those requests at future events.
            </p>
          </FAQItem>

          {/* Q6 */}
          <FAQItem question="Can we do another shirt order so I can get one?">
            <p>
              If we get enough interest, we can place another order for custom shirts! If you&apos;d like one,
              please let us know by emailing{' '}
              <a
                href="mailto:meepmail@meepmeet.club"
                style={{ color: '#C9A961', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                meepmail@meepmeet.club
              </a>{' '}
              so we can add you to the list.
            </p>
            <div className="mt-4 flex gap-4 flex-wrap">
              <Image
                src="/mm-shirt-front.jpg"
                alt="Shirt front"
                width={220}
                height={220}
                className="rounded-lg object-cover"
                style={{ border: '1px solid rgba(201,169,97,0.3)' }}
              />
              <Image
                src="/mm-shirt-back.jpg"
                alt="Shirt back"
                width={220}
                height={220}
                className="rounded-lg object-cover"
                style={{ border: '1px solid rgba(201,169,97,0.3)' }}
              />
            </div>
          </FAQItem>

          {/* Q7 */}
          <FAQItem question="I want to be a Game Master, how can I become one?">
            <p>
              We would love to expand our roster of Game Masters! More GMs means more tables being taught and
              more Meeps rotating in and out. If you&apos;re interested, let us know and we can figure out which
              game you&apos;d like to teach and which event you&apos;d like to try your hand at it. If you enjoy
              it, we can add you to the rotation!
            </p>
          </FAQItem>

          {/* Q8 */}
          <FAQItem question="How can I make a donation to support food, beverages, and the club?">
            <p>
              Donations for food, beverages, and general support are greatly appreciated and can be made via:
            </p>
            <ul className="mt-3 flex flex-col gap-1.5" style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
              <li>
                <span style={{ color: '#C9A961', fontWeight: 600 }}>Venmo</span> —{' '}
                <span style={{ fontFamily: 'monospace' }}>@christopher-drake-6</span>
              </li>
              <li>
                <span style={{ color: '#C9A961', fontWeight: 600 }}>Zelle</span>
              </li>
            </ul>
            <p className="mt-3" style={{ color: 'rgba(232,212,184,0.65)', fontStyle: 'italic' }}>
              Feel free to send as much as you feel you eat or drink at any given event. Donations are optional
              but much appreciated!
            </p>
          </FAQItem>

        </div>
      </main>
    </>
  )
}
