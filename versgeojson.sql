-- FUNCTION: f.versgeojson_n(text[])

-- DROP FUNCTION IF EXISTS f.versgeojson_n(text[]);

CREATE OR REPLACE FUNCTION f.versgeojson_n(
	tab_nom_vue text[])
    RETURNS text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
declare 
contenu_geojson text;
type_geom_vue text;
tab_geojson text[];
tab_nom_vue_idx integer := 1;
tab_nom_vue_length integer;
begin 
tab_nom_vue_length = array_length(tab_nom_vue,1);
while tab_nom_vue_idx <= tab_nom_vue_length loop
	EXECUTE ('select ST_GeometryType(geom) from ' || quote_ident(tab_nom_vue[tab_nom_vue_idx])) into type_geom_vue;
	if (type_geom_vue = 'ST_Point') then
		EXECUTE '
		  with VueWGS84 as (
			select *, ST_Transform(geom, 4326) as geomwgs84	from ' || quote_ident(tab_nom_vue[tab_nom_vue_idx]) || ' 
		  ),
		  VueGeojson as (
			select jsonb_build_object(
			  ''type'', ''FeatureCollection'',
			  ''features'', jsonb_agg(GeoJsonFeature)
			) as GeoJson_col
			from (
			  select jsonb_build_object(
				''type'', ''Feature'',
				''geometry'', ST_AsGeoJSON(geomwgs84)::jsonb,
				''properties'', to_jsonb(VueWGS84) - ''geom'' - ''geomwgs84'' 
			  ) as GeoJsonFeature
			  from VueWGS84
			) Tmp)
		  select GeoJson_col::character varying from VueGeojson' into contenu_geojson;		  
	else
		EXECUTE '
		  with VueWGS84 as (
			select *, ST_FORCE2D(ST_Transform(ST_Multi(geom), 4326)) as geomwgs84	from ' || quote_ident(tab_nom_vue[tab_nom_vue_idx]) || ' 
		  ),
		  VueGeojson as (
			select jsonb_build_object(
			  ''type'', ''FeatureCollection'',
			  ''features'', jsonb_agg(GeoJsonFeature)
			) as GeoJson_col
			from (
			  select jsonb_build_object(
				''type'', ''Feature'',
				''geometry'', ST_AsGeoJSON(geomwgs84)::jsonb,
				''properties'', to_jsonb(VueWGS84) - ''geom'' - ''geomwgs84'' 
			  ) as GeoJsonFeature
			  from VueWGS84
			) Tmp)
		  select GeoJson_col::character varying from VueGeojson' into contenu_geojson;
	end if;
tab_geojson[tab_nom_vue_idx] := 'tabCoucheMetier.push([' || contenu_geojson || '])';		
tab_nom_vue_idx := tab_nom_vue_idx + 1;
end loop;
return array_to_string(tab_geojson, ';');	
end;
$BODY$;

ALTER FUNCTION f.versgeojson_n(text[])
    OWNER TO maitrejedi;

GRANT EXECUTE ON FUNCTION f.versgeojson_n(text[]) TO PUBLIC;

GRANT EXECUTE ON FUNCTION f.versgeojson_n(text[]) TO maitrejedi;

GRANT EXECUTE ON FUNCTION f.versgeojson_n(text[]) TO padawan;

