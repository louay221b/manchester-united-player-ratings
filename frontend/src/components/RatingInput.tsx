const ratings = Array.from({ length: 19 }, (_, index) => 1 + index * 0.5);

interface RatingInputProps {
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function RatingInput({ value, onChange, disabled = false }: RatingInputProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-[repeat(19,minmax(0,1fr))]">
      {ratings.map((rating) => {
        const isSelected = value === rating;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            aria-pressed={isSelected}
            disabled={disabled}
            className={[
              'focus-ring flex h-10 min-w-10 items-center justify-center rounded-md border text-sm font-bold',
              isSelected
                ? 'border-united-red bg-united-red text-white'
                : 'border-zinc-300 bg-white text-zinc-700 hover:border-united-red hover:text-united-red',
              disabled ? 'cursor-not-allowed opacity-60' : '',
            ].join(' ')}
          >
            {rating.toFixed(rating % 1 === 0 ? 0 : 1)}
          </button>
        );
      })}
    </div>
  );
}
