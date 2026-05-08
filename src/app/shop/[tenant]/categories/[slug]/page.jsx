export default function CategoryPage({ params }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold">Categoría: {params.slug}</h1>
      <p className="mt-4 text-gray-600">
        Próxima etapa: Implementar filtrado por categoría
      </p>
    </div>
  );
}
