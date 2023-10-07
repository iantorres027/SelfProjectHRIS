--TRUNCATE TABLE Currency
--TRUNCATE TABLE CurrencyRate

IF NOT EXISTS (SELECT 1 FROM [dbo].[Currency])
BEGIN
	DECLARE @CurrencyTb table 
	(
		country nvarchar(100),
		currency nvarchar(100),
		code nvarchar(100),
		symbol nvarchar(100)
	)

	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Albania', 'Leke', 'ALL', 'Lek');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('America', 'Dollars', 'USD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Afghanistan', 'Afghanis', 'AFN', '؋');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Argentina', 'Pesos', 'ARS', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Aruba', 'Guilders', 'AWG', 'ƒ');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Australia', 'Dollars', 'AUD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Azerbaijan', 'New Manats', 'AZN', 'ман');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Bahamas', 'Dollars', 'BSD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Barbados', 'Dollars', 'BBD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Belarus', 'Rubles', 'BYR', 'p.');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Belgium', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Beliz', 'Dollars', 'BZD', 'BZ$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Bermuda', 'Dollars', 'BMD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Bolivia', 'Bolivianos', 'BOB', '$b');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Bosnia and Herzegovina', 'Convertible Marka', 'BAM', 'KM');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Botswana', 'Pula', 'BWP', 'P');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Bulgaria', 'Leva', 'BGN', 'лв');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Brazil', 'Reais', 'BRL', 'R$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Britain (United Kingdom)', 'Pounds', 'GBP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Brunei Darussalam', 'Dollars', 'BND', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Cambodia', 'Riels', 'KHR', '៛');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Canada', 'Dollars', 'CAD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Cayman Islands', 'Dollars', 'KYD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Chile', 'Pesos', 'CLP', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('China', 'Yuan Renminbi', 'CNY', '¥');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Colombia', 'Pesos', 'COP', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Costa Rica', 'Colón', 'CRC', '₡');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Croatia', 'Kuna', 'HRK', 'kn');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Cuba', 'Pesos', 'CUP', '₱');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Cyprus', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Czech Republic', 'Koruny', 'CZK', 'Kč');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Denmark', 'Kroner', 'DKK', 'kr');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Dominican Republic', 'Pesos', 'DOP ', 'RD$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('East Caribbean', 'Dollars', 'XCD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Egypt', 'Pounds', 'EGP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('El Salvador', 'Colones', 'SVC', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('England (United Kingdom)', 'Pounds', 'GBP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Euro', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Falkland Islands', 'Pounds', 'FKP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Fiji', 'Dollars', 'FJD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('France', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Ghana', 'Cedis', 'GHC', '¢');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Gibraltar', 'Pounds', 'GIP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Greece', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Guatemala', 'Quetzales', 'GTQ', 'Q');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Guernsey', 'Pounds', 'GGP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Guyana', 'Dollars', 'GYD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Holland (Netherlands)', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Honduras', 'Lempiras', 'HNL', 'L');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Hong Kong', 'Dollars', 'HKD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Hungary', 'Forint', 'HUF', 'Ft');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Iceland', 'Kronur', 'ISK', 'kr');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('India', 'Rupees', 'INR', 'Rp');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Indonesia', 'Rupiahs', 'IDR', 'Rp');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Iran', 'Rials', 'IRR', '﷼');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Ireland', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Isle of Man', 'Pounds', 'IMP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Israel', 'New Shekels', 'ILS', '₪');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Italy', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Jamaica', 'Dollars', 'JMD', 'J$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Japan', 'Yen', 'JPY', '¥');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Jersey', 'Pounds', 'JEP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Kazakhstan', 'Tenge', 'KZT', 'лв');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Korea (North)', 'Won', 'KPW', '₩');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Korea (South)', 'Won', 'KRW', '₩');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Kyrgyzstan', 'Soms', 'KGS', 'лв');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Laos', 'Kips', 'LAK', '₭');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Latvia', 'Lati', 'LVL', 'Ls');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Lebanon', 'Pounds', 'LBP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Liberia', 'Dollars', 'LRD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Liechtenstein', 'Switzerland Francs', 'CHF', 'CHF');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Lithuania', 'Litai', 'LTL', 'Lt');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Luxembourg', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Macedonia', 'Denars', 'MKD', 'ден');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Malaysia', 'Ringgits', 'MYR', 'RM');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Malta', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Mauritius', 'Rupees', 'MUR', '₨');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Mexico', 'Pesos', 'MXN', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Mongolia', 'Tugriks', 'MNT', '₮');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Mozambique', 'Meticais', 'MZN', 'MT');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Namibia', 'Dollars', 'NAD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Nepal', 'Rupees', 'NPR', '₨');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Netherlands Antilles', 'Guilders', 'ANG', 'ƒ');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Netherlands', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('New Zealand', 'Dollars', 'NZD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Nicaragua', 'Cordobas', 'NIO', 'C$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Nigeria', 'Nairas', 'NGN', '₦');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('North Korea', 'Won', 'KPW', '₩');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Norway', 'Krone', 'NOK', 'kr');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Oman', 'Rials', 'OMR', '﷼');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Pakistan', 'Rupees', 'PKR', '₨');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Panama', 'Balboa', 'PAB', 'B/.');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Paraguay', 'Guarani', 'PYG', 'Gs');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Peru', 'Nuevos Soles', 'PEN', 'S/.');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Philippines', 'Pesos', 'PHP', 'Php');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Poland', 'Zlotych', 'PLN', 'zł');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Qatar', 'Rials', 'QAR', '﷼');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Romania', 'New Lei', 'RON', 'lei');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Russia', 'Rubles', 'RUB', 'руб');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Saint Helena', 'Pounds', 'SHP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Saudi Arabia', 'Riyals', 'SAR', '﷼');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Serbia', 'Dinars', 'RSD', 'Дин.');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Seychelles', 'Rupees', 'SCR', '₨');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Singapore', 'Dollars', 'SGD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Slovenia', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Solomon Islands', 'Dollars', 'SBD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Somalia', 'Shillings', 'SOS', 'S');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('South Africa', 'Rand', 'ZAR', 'R');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('South Korea', 'Won', 'KRW', '₩');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Spain', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Sri Lanka', 'Rupees', 'LKR', '₨');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Sweden', 'Kronor', 'SEK', 'kr');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Switzerland', 'Francs', 'CHF', 'CHF');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Suriname', 'Dollars', 'SRD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Syria', 'Pounds', 'SYP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Taiwan', 'New Dollars', 'TWD', 'NT$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Thailand', 'Baht', 'THB', '฿');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Trinidad and Tobago', 'Dollars', 'TTD', 'TT$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Turkey', 'Lira', 'TRY', 'TL');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Turkey', 'Liras', 'TRL', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Tuvalu', 'Dollars', 'TVD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Ukraine', 'Hryvnia', 'UAH', '₴');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('United Kingdom', 'Pounds', 'GBP', '£');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('United States of America', 'Dollars', 'USD', '$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Uruguay', 'Pesos', 'UYU', '$U');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Uzbekistan', 'Sums', 'UZS', 'лв');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Vatican City', 'Euro', 'EUR', '€');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Venezuela', 'Bolivares Fuertes', 'VEF', 'Bs');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Vietnam', 'Dong', 'VND', '₫');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Yemen', 'Rials', 'YER', '﷼');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('Zimbabwe', 'Zimbabwe Dollars', 'ZWD', 'Z$');
	INSERT INTO @CurrencyTb (country, currency, code, symbol) VALUES ('India', 'Rupees', 'INR', '₹');

	INSERT INTO Currency (Code, [Name], CountryId, Symbol, IsDefault, IsDisabled, CreatedById, ModifiedById, CompanyId)
	SELECT ctb.code, ctb.currency, ISNULL(cc.Id,0), ctb.symbol, 0, 1, 1, 1, 1
	FROM
		@CurrencyTb ctb
		LEFT OUTER JOIN Country cc ON cc.CountryName LIKE '%'+ctb.country+'%'

END
GO